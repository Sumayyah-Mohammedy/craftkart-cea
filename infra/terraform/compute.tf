# =====================================================================
# COMPUTE: EC2 container hosts in Auto Scaling Groups (one per tier)
# Every instance boots Amazon Linux 2023, installs Docker, pulls the image
# tag recorded in SSM Parameter Store from ECR, and runs the container.
# Instances are immutable: a deploy replaces them via an ASG instance refresh.
# =====================================================================

data "aws_ssm_parameter" "al2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

# ---------------- IAM: one least-privilege role per tier ----------------
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "tier" {
  for_each           = toset(["web", "app"])
  name               = "${local.name}-${each.key}-instance-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

# Session Manager shell + Run Command (no SSH keys, no bastion, port 22 never opened)
resource "aws_iam_role_policy_attachment" "ssm_core" {
  for_each   = aws_iam_role.tier
  role       = each.value.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

locals {
  ecr_repo_for_tier = { web = "frontend", app = "backend" }
}

data "aws_iam_policy_document" "tier" {
  for_each = toset(["web", "app"])

  statement {
    sid       = "EcrAuth"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  statement {
    sid       = "PullOwnImageOnly"
    actions   = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability"]
    resources = [aws_ecr_repository.this[local.ecr_repo_for_tier[each.key]].arn]
  }
  statement {
    sid       = "ReadOwnImageTag"
    actions   = ["ssm:GetParameter"]
    resources = [aws_ssm_parameter.image_tag[local.ecr_repo_for_tier[each.key]].arn]
  }
  statement {
    sid       = "ShipContainerLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogStreams"]
    resources = ["${aws_cloudwatch_log_group.tier[each.key].arn}:*"]
  }

  # Only the APP tier may read the application secret
  dynamic "statement" {
    for_each = each.key == "app" ? [1] : []
    content {
      sid       = "ReadAppSecret"
      actions   = ["secretsmanager:GetSecretValue"]
      resources = [aws_secretsmanager_secret.app.arn]
    }
  }
}

resource "aws_iam_role_policy" "tier" {
  for_each = aws_iam_role.tier
  name     = "${local.name}-${each.key}-least-privilege"
  role     = each.value.id
  policy   = data.aws_iam_policy_document.tier[each.key].json
}

resource "aws_iam_instance_profile" "tier" {
  for_each = aws_iam_role.tier
  name     = "${local.name}-${each.key}-profile"
  role     = each.value.name
}

# ---------------- Launch templates ----------------
locals {
  public_url = local.https_enabled ? "https://${aws_lb.public.dns_name}" : "http://${aws_lb.public.dns_name}"
  registry   = "${local.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

resource "aws_launch_template" "web" {
  name_prefix            = "${local.name}-web-"
  image_id               = data.aws_ssm_parameter.al2023_ami.value
  instance_type          = var.instance_type
  vpc_security_group_ids = [aws_security_group.web.id]
  update_default_version = true

  iam_instance_profile {
    arn = aws_iam_instance_profile.tier["web"].arn
  }

  metadata_options {
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 2
  }

  monitoring {
    enabled = false # basic 5-minute metrics are free; detailed costs extra
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 8
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/templates/web_user_data.sh.tftpl", {
    region      = var.aws_region
    registry    = local.registry
    image_repo  = aws_ecr_repository.this["frontend"].repository_url
    tag_param   = aws_ssm_parameter.image_tag["frontend"].name
    backend_url = "http://${aws_lb.internal.dns_name}"
    log_group   = aws_cloudwatch_log_group.tier["web"].name
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${local.name}-web", Tier = "web" }
  }
}

resource "aws_launch_template" "app" {
  name_prefix            = "${local.name}-app-"
  image_id               = data.aws_ssm_parameter.al2023_ami.value
  instance_type          = var.instance_type
  vpc_security_group_ids = [aws_security_group.app.id]
  update_default_version = true

  iam_instance_profile {
    arn = aws_iam_instance_profile.tier["app"].arn
  }

  metadata_options {
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 8
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/templates/app_user_data.sh.tftpl", {
    region         = var.aws_region
    registry       = local.registry
    image_repo     = aws_ecr_repository.this["backend"].repository_url
    tag_param      = aws_ssm_parameter.image_tag["backend"].name
    secret_id      = aws_secretsmanager_secret.app.arn
    frontend_url   = local.public_url
    log_group      = aws_cloudwatch_log_group.tier["app"].name
    seed_demo_data = var.seed_demo_data
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${local.name}-app", Tier = "app" }
  }

  # RDS + secret must exist before the first API container starts
  depends_on = [aws_secretsmanager_secret_version.app, aws_db_instance.main]
}

# ---------------- Auto Scaling Groups (span both AZs) ----------------
resource "aws_autoscaling_group" "web" {
  name                      = "${local.name}-asg-web"
  vpc_zone_identifier       = aws_subnet.web[*].id
  min_size                  = var.web_min_size
  desired_capacity          = var.web_desired_capacity
  max_size                  = var.web_max_size
  target_group_arns         = [aws_lb_target_group.web.arn]
  health_check_type         = "ELB" # replace instances the load balancer marks unhealthy
  health_check_grace_period = 180
  default_instance_warmup   = 120

  launch_template {
    id      = aws_launch_template.web.id
    version = aws_launch_template.web.latest_version
  }

  # Rolling, zero-downtime replacement when the launch template changes
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 100
      max_healthy_percentage = 200
      instance_warmup        = 120
    }
  }

  enabled_metrics = ["GroupInServiceInstances", "GroupDesiredCapacity", "GroupMinSize", "GroupMaxSize"]

  tag {
    key                 = "Name"
    value               = "${local.name}-web"
    propagate_at_launch = true
  }

  lifecycle {
    ignore_changes = [desired_capacity] # owned by the scaling policy at runtime
  }
}

resource "aws_autoscaling_group" "app" {
  name                      = "${local.name}-asg-app"
  vpc_zone_identifier       = aws_subnet.app[*].id
  min_size                  = var.app_min_size
  desired_capacity          = var.app_desired_capacity
  max_size                  = var.app_max_size
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 180
  default_instance_warmup   = 120

  launch_template {
    id      = aws_launch_template.app.id
    version = aws_launch_template.app.latest_version
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 100
      max_healthy_percentage = 200
      instance_warmup        = 120
    }
  }

  enabled_metrics = ["GroupInServiceInstances", "GroupDesiredCapacity", "GroupMinSize", "GroupMaxSize"]

  tag {
    key                 = "Name"
    value               = "${local.name}-app"
    propagate_at_launch = true
  }

  lifecycle {
    ignore_changes = [desired_capacity]
  }
}

# ---------------- Elasticity: target-tracking scaling policies ----------------
resource "aws_autoscaling_policy" "web_cpu" {
  name                   = "${local.name}-web-cpu-target"
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type            = "TargetTrackingScaling"
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = var.cpu_target_percent
  }
}

resource "aws_autoscaling_policy" "web_requests" {
  name                   = "${local.name}-web-requests-target"
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type            = "TargetTrackingScaling"
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.public.arn_suffix}/${aws_lb_target_group.web.arn_suffix}"
    }
    target_value = 1000 # requests per target per minute
  }
}

resource "aws_autoscaling_policy" "app_cpu" {
  name                   = "${local.name}-app-cpu-target"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"
  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = var.cpu_target_percent
  }
}
