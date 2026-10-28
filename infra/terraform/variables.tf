variable "project" {
  description = "Project name, used as a prefix for every resource"
  type        = string
  default     = "craftkart"
}

variable "environment" {
  description = "Environment name (dev / prod)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region. ap-south-1 (Mumbai) is the closest region to Pakistan"
  type        = string
  default     = "ap-south-1"
}

# ---------------- Network ----------------
variable "vpc_cidr" {
  description = "VPC address range"
  type        = string
  default     = "10.0.0.0/16"
}

variable "single_nat_gateway" {
  description = "true = one NAT gateway shared by both AZs (cheaper). false = one NAT per AZ (highly available)"
  type        = bool
  default     = true
}

# ---------------- Compute ----------------
variable "instance_type" {
  description = "EC2 type for web and app container hosts (t3.micro is free-tier eligible)"
  type        = string
  default     = "t3.micro"
}

variable "web_min_size" {
  type    = number
  default = 1
}
variable "web_desired_capacity" {
  type    = number
  default = 2
}
variable "web_max_size" {
  type    = number
  default = 4
}
variable "app_min_size" {
  type    = number
  default = 1
}
variable "app_desired_capacity" {
  type    = number
  default = 2
}
variable "app_max_size" {
  type    = number
  default = 4
}

variable "cpu_target_percent" {
  description = "Target average CPU for the Auto Scaling target-tracking policies"
  type        = number
  default     = 50
}

variable "initial_image_tag" {
  description = "Image tag the ASGs start with before CI/CD publishes a real one"
  type        = string
  default     = "latest"
}

# ---------------- Database ----------------
variable "db_instance_class" {
  description = "RDS instance class (db.t3.micro / db.t4g.micro are free-tier eligible)"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "PostgreSQL major version"
  type        = string
  default     = "16"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_multi_az" {
  description = "Standby replica in a second AZ with automatic failover (NOT free tier, ~2x DB cost)"
  type        = bool
  default     = false
}

variable "db_name" {
  type    = string
  default = "craftkart"
}

variable "db_username" {
  type    = string
  default = "craftkart_app"
}

variable "db_backup_retention_days" {
  type    = number
  default = 1
}

# ---------------- Application secrets / config ----------------
variable "stripe_secret_key" {
  description = "Stripe TEST secret key (sk_test_...). Leave empty to disable card checkout"
  type        = string
  default     = ""
  sensitive   = true
}

variable "admin_email" {
  type    = string
  default = "admin@craftkart.com"
}

variable "certificate_arn" {
  description = "Optional ACM certificate ARN. When set, the public ALB serves HTTPS and redirects HTTP"
  type        = string
  default     = ""
}

# ---------------- CI/CD ----------------
variable "github_repository" {
  description = "GitHub repository allowed to deploy, in owner/name form (e.g. sabdullahhyder/craftkart)"
  type        = string
}

variable "create_github_oidc_provider" {
  description = "Set false if your AWS account already has the token.actions.githubusercontent.com OIDC provider"
  type        = bool
  default     = true
}

# ---------------- Monitoring ----------------
variable "alarm_email" {
  description = "Optional e-mail address that receives CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  type    = number
  default = 14
}

variable "enable_alb_access_logs" {
  description = "Store public ALB access logs in an S3 bucket (object storage enhancement)"
  type        = bool
  default     = true
}

variable "seed_demo_data" {
  description = "Create the admin account and demo products/users on first boot (skipped if data exists)"
  type        = bool
  default     = true
}
