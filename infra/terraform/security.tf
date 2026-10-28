# =====================================================================
# SECURITY GROUPS - one per tier, each only accepts traffic from the tier
# directly in front of it (principle of least privilege):
#
#   Internet --80/443--> sg-alb-public --80--> sg-web --80--> sg-alb-internal
#            --5000--> sg-app --5432--> sg-db
# =====================================================================

resource "aws_security_group" "alb_public" {
  name        = "${local.name}-sg-alb-public"
  description = "Public ALB: HTTP/HTTPS from the internet"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-sg-alb-public" }
}

resource "aws_security_group" "web" {
  name        = "${local.name}-sg-web"
  description = "Web tier (Nginx): only from the public ALB"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-sg-web" }
}

resource "aws_security_group" "alb_internal" {
  name        = "${local.name}-sg-alb-internal"
  description = "Internal ALB: only from the web tier"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-sg-alb-internal" }
}

resource "aws_security_group" "app" {
  name        = "${local.name}-sg-app"
  description = "App tier (Node API): only from the internal ALB"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-sg-app" }
}

resource "aws_security_group" "db" {
  name        = "${local.name}-sg-db"
  description = "RDS PostgreSQL: only from the app tier"
  vpc_id      = aws_vpc.main.id
  tags        = { Name = "${local.name}-sg-db" }
}

# ---------- public ALB ----------
resource "aws_vpc_security_group_ingress_rule" "alb_public_http" {
  security_group_id = aws_security_group.alb_public.id
  description       = "HTTP from anywhere"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "alb_public_https" {
  security_group_id = aws_security_group.alb_public.id
  description       = "HTTPS from anywhere"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "alb_public_to_web" {
  security_group_id            = aws_security_group.alb_public.id
  description                  = "Forward to web tier"
  referenced_security_group_id = aws_security_group.web.id
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
}

# ---------- web tier ----------
resource "aws_vpc_security_group_ingress_rule" "web_from_alb" {
  security_group_id            = aws_security_group.web.id
  description                  = "HTTP from public ALB only"
  referenced_security_group_id = aws_security_group.alb_public.id
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
}

resource "aws_vpc_security_group_egress_rule" "web_to_internal_alb" {
  security_group_id            = aws_security_group.web.id
  description                  = "Proxy /api to internal ALB"
  referenced_security_group_id = aws_security_group.alb_internal.id
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
}

resource "aws_vpc_security_group_egress_rule" "web_https_out" {
  security_group_id = aws_security_group.web.id
  description       = "HTTPS out via NAT (ECR, SSM, CloudWatch)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "web_http_out" {
  security_group_id = aws_security_group.web.id
  description       = "HTTP out via NAT (OS package repositories)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

# ---------- internal ALB ----------
resource "aws_vpc_security_group_ingress_rule" "alb_internal_from_web" {
  security_group_id            = aws_security_group.alb_internal.id
  description                  = "HTTP from web tier only"
  referenced_security_group_id = aws_security_group.web.id
  ip_protocol                  = "tcp"
  from_port                    = 80
  to_port                      = 80
}

resource "aws_vpc_security_group_egress_rule" "alb_internal_to_app" {
  security_group_id            = aws_security_group.alb_internal.id
  description                  = "Forward to app tier"
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 5000
  to_port                      = 5000
}

# ---------- app tier ----------
resource "aws_vpc_security_group_ingress_rule" "app_from_internal_alb" {
  security_group_id            = aws_security_group.app.id
  description                  = "API port from internal ALB only"
  referenced_security_group_id = aws_security_group.alb_internal.id
  ip_protocol                  = "tcp"
  from_port                    = 5000
  to_port                      = 5000
}

resource "aws_vpc_security_group_egress_rule" "app_to_db" {
  security_group_id            = aws_security_group.app.id
  description                  = "PostgreSQL to RDS"
  referenced_security_group_id = aws_security_group.db.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}

resource "aws_vpc_security_group_egress_rule" "app_https_out" {
  security_group_id = aws_security_group.app.id
  description       = "HTTPS out via NAT (ECR, Secrets Manager, CloudWatch, Stripe API)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "app_http_out" {
  security_group_id = aws_security_group.app.id
  description       = "HTTP out via NAT (OS package repositories)"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

# ---------- database ----------
resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "PostgreSQL from app tier only"
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
}
# (no egress rules on sg-db: the database initiates no connections)
