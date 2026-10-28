output "app_url" {
  description = "Open this in a browser"
  value       = local.public_url
}

output "public_alb_dns" {
  value = aws_lb.public.dns_name
}

output "internal_alb_dns" {
  value = aws_lb.internal.dns_name
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "subnets" {
  value = {
    public      = aws_subnet.public[*].id
    private_web = aws_subnet.web[*].id
    private_app = aws_subnet.app[*].id
    private_db  = aws_subnet.db[*].id
  }
}

output "ecr_repositories" {
  value = { for k, r in aws_ecr_repository.this : k => r.repository_url }
}

output "rds_endpoint" {
  description = "Private endpoint - only resolvable/reachable inside the VPC"
  value       = aws_db_instance.main.address
}

output "asg_names" {
  value = { web = aws_autoscaling_group.web.name, app = aws_autoscaling_group.app.name }
}

output "app_secret_arn" {
  value = aws_secretsmanager_secret.app.arn
}

output "cloudwatch_dashboard" {
  value = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards/dashboard/${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "admin_login" {
  description = "Admin account created by the seed step (terraform output -json admin_login)"
  value       = { email = var.admin_email, password = random_password.admin.result }
  sensitive   = true
}

# Copy-paste these to configure the GitHub repository (requires the GitHub CLI `gh`)
output "github_setup_commands" {
  value = <<-EOT
    gh secret   set AWS_ROLE_ARN      --body "${aws_iam_role.github_actions.arn}"
    gh variable set AWS_REGION        --body "${var.aws_region}"
    gh variable set ECR_REGISTRY      --body "${local.registry}"
    gh variable set ECR_REPO_FRONTEND --body "${aws_ecr_repository.this["frontend"].name}"
    gh variable set ECR_REPO_BACKEND  --body "${aws_ecr_repository.this["backend"].name}"
    gh variable set SSM_TAG_FRONTEND  --body "${aws_ssm_parameter.image_tag["frontend"].name}"
    gh variable set SSM_TAG_BACKEND   --body "${aws_ssm_parameter.image_tag["backend"].name}"
    gh variable set ASG_WEB           --body "${aws_autoscaling_group.web.name}"
    gh variable set ASG_APP           --body "${aws_autoscaling_group.app.name}"
    gh variable set APP_URL           --body "${local.public_url}"
  EOT
}
