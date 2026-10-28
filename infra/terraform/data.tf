# =====================================================================
# CONTAINER REGISTRY (ECR), SECRETS (Secrets Manager), DATABASE (RDS)
# =====================================================================

# ---------------- ECR repositories ----------------
resource "aws_ecr_repository" "this" {
  for_each             = toset(["frontend", "backend"])
  name                 = "${var.project}-${each.key}"
  image_tag_mutability = "MUTABLE" # CI pushes both :<git-sha> (immutable by convention) and :latest
  force_delete         = true      # lets `terraform destroy` remove repos that still contain images

  image_scanning_configuration {
    scan_on_push = true # free basic vulnerability scan of every pushed image
  }
  encryption_configuration {
    encryption_type = "AES256"
  }
}

# Keep only the 10 most recent images per repo (stays inside the 500 MB ECR free tier)
resource "aws_ecr_lifecycle_policy" "this" {
  for_each   = aws_ecr_repository.this
  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire all but the 10 newest images"
      selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 10 }
      action       = { type = "expire" }
    }]
  })
}

# ---------------- Generated secrets ----------------
resource "random_password" "db" {
  length           = 32
  special          = true
  override_special = "_-+=" # characters RDS accepts in master passwords
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "random_password" "admin" {
  length           = 16
  special          = true
  override_special = "!@#"
}

# ---------------- RDS PostgreSQL ----------------
resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db-subnets"
  subnet_ids = aws_subnet.db[*].id
  tags       = { Name = "${local.name}-db-subnets" }
}

resource "aws_db_parameter_group" "pg" {
  name   = "${local.name}-pg${var.db_engine_version}"
  family = "postgres${var.db_engine_version}"

  parameter {
    name  = "rds.force_ssl" # reject any unencrypted connection
    value = "1"
  }
  parameter {
    name  = "log_min_duration_statement" # log queries slower than 500 ms
    value = "500"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "${local.name}-postgres"
  engine         = "postgres"
  engine_version = var.db_engine_version
  instance_class = var.db_instance_class

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result
  port     = 5432

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 2 # storage autoscaling
  storage_type          = "gp2"
  storage_encrypted     = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  parameter_group_name   = aws_db_parameter_group.pg.name
  publicly_accessible    = false # never reachable from the internet
  multi_az               = var.db_multi_az

  backup_retention_period         = var.db_backup_retention_days
  backup_window                   = "20:00-21:00" # 01:00-02:00 PKT
  maintenance_window              = "sun:21:00-sun:22:00"
  auto_minor_version_upgrade      = true
  enabled_cloudwatch_logs_exports = ["postgresql"]

  deletion_protection          = false # coursework: allow `terraform destroy`
  skip_final_snapshot          = true
  copy_tags_to_snapshot        = true
  apply_immediately            = true
  performance_insights_enabled = false

  tags = { Name = "${local.name}-postgres" }
}

# ---------------- Secrets Manager: everything the API needs ----------------
# The app instances read this at boot through their IAM role; nothing is hard-coded
# in code, images, Git or the CI pipeline.
resource "aws_secretsmanager_secret" "app" {
  name                    = "${local.name}/app"
  description             = "CraftKart API runtime secrets (DB credentials, JWT, Stripe)"
  recovery_window_in_days = 0 # allow immediate re-create after destroy (coursework)
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id
  secret_string = jsonencode({
    DB_HOST           = aws_db_instance.main.address
    DB_PORT           = tostring(aws_db_instance.main.port)
    DB_NAME           = var.db_name
    DB_USER           = var.db_username
    DB_PASSWORD       = random_password.db.result
    JWT_SECRET        = random_password.jwt.result
    STRIPE_SECRET_KEY = var.stripe_secret_key
    ADMIN_EMAIL       = var.admin_email
    ADMIN_PASSWORD    = random_password.admin.result
  })
}

# ---------------- SSM parameters: which image version each tier runs ----------------
# CI/CD updates these, then triggers an ASG instance refresh.
resource "aws_ssm_parameter" "image_tag" {
  for_each = toset(["frontend", "backend"])
  name     = "/${var.project}/${var.environment}/${each.key}/image_tag"
  type     = "String"
  value    = var.initial_image_tag

  lifecycle {
    ignore_changes = [value] # owned by the pipeline after the first apply
  }
}
