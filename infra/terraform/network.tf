# =====================================================================
# NETWORK LAYER
#   VPC 10.0.0.0/16 across 2 Availability Zones
#   public subnets   10.0.1.0/24,  10.0.2.0/24   -> public ALB, NAT gateway
#   private web      10.0.11.0/24, 10.0.12.0/24  -> Nginx/React containers
#   private app      10.0.21.0/24, 10.0.22.0/24  -> internal ALB, Node API containers
#   private db       10.0.31.0/24, 10.0.32.0/24  -> RDS PostgreSQL (no internet route)
# =====================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "${local.name}-vpc" }
}

locals {
  public_cidrs = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, 1 + i)]
  web_cidrs    = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, 11 + i)]
  app_cidrs    = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, 21 + i)]
  db_cidrs     = [for i in range(2) : cidrsubnet(var.vpc_cidr, 8, 31 + i)]
  nat_count    = var.single_nat_gateway ? 1 : 2
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_cidrs[count.index]
  availability_zone       = local.azs[count.index]
  map_public_ip_on_launch = false # nothing in here gets an IP unless it asks (ALB/NAT)
  tags                    = { Name = "${local.name}-public-${local.azs[count.index]}", Tier = "public" }
}

resource "aws_subnet" "web" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.web_cidrs[count.index]
  availability_zone = local.azs[count.index]
  tags              = { Name = "${local.name}-private-web-${local.azs[count.index]}", Tier = "web" }
}

resource "aws_subnet" "app" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.app_cidrs[count.index]
  availability_zone = local.azs[count.index]
  tags              = { Name = "${local.name}-private-app-${local.azs[count.index]}", Tier = "app" }
}

resource "aws_subnet" "db" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.db_cidrs[count.index]
  availability_zone = local.azs[count.index]
  tags              = { Name = "${local.name}-private-db-${local.azs[count.index]}", Tier = "db" }
}

# ---------------- Internet Gateway + public routing ----------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name}-igw" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = { Name = "${local.name}-rt-public" }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ---------------- NAT gateway(s): outbound-only internet for private web/app ----------------
# Needed to pull images from ECR, reach Secrets Manager/SSM/CloudWatch and the Stripe API.
resource "aws_eip" "nat" {
  count  = local.nat_count
  domain = "vpc"
  tags   = { Name = "${local.name}-nat-eip-${count.index}" }
}

resource "aws_nat_gateway" "main" {
  count         = local.nat_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags          = { Name = "${local.name}-nat-${local.azs[count.index]}" }
  depends_on    = [aws_internet_gateway.main]
}

# One private route table per AZ so each AZ can use its own NAT when single_nat_gateway = false
resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[var.single_nat_gateway ? 0 : count.index].id
  }
  tags = { Name = "${local.name}-rt-private-${local.azs[count.index]}" }
}

resource "aws_route_table_association" "web" {
  count          = 2
  subnet_id      = aws_subnet.web[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "app" {
  count          = 2
  subnet_id      = aws_subnet.app[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# DB subnets: local VPC route only -> the database can never reach (or be reached from) the internet
resource "aws_route_table" "db" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name}-rt-db-isolated" }
}

resource "aws_route_table_association" "db" {
  count          = 2
  subnet_id      = aws_subnet.db[count.index].id
  route_table_id = aws_route_table.db.id
}

# ---------------- Network ACL on the DB subnets (defence in depth) ----------------
# Stateless subnet firewall: only PostgreSQL from the app subnets, plus return traffic.
resource "aws_network_acl" "db" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.db[*].id
  tags       = { Name = "${local.name}-nacl-db" }
}

resource "aws_network_acl_rule" "db_in_pg" {
  count          = 2
  network_acl_id = aws_network_acl.db.id
  rule_number    = 100 + count.index
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.app_cidrs[count.index]
  from_port      = 5432
  to_port        = 5432
}

resource "aws_network_acl_rule" "db_out_ephemeral" {
  count          = 2
  network_acl_id = aws_network_acl.db.id
  rule_number    = 100 + count.index
  egress         = true
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = local.app_cidrs[count.index]
  from_port      = 1024
  to_port        = 65535
}

# Multi-AZ replication between the two DB subnets (used only when db_multi_az = true)
resource "aws_network_acl_rule" "db_in_intra" {
  count          = 2
  network_acl_id = aws_network_acl.db.id
  rule_number    = 200 + count.index
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = local.db_cidrs[count.index]
}

resource "aws_network_acl_rule" "db_out_intra" {
  count          = 2
  network_acl_id = aws_network_acl.db.id
  rule_number    = 200 + count.index
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = local.db_cidrs[count.index]
}
