resource "aws_db_subnet_group" "main" {
  name       = "soropool-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "soropool-rds-subnet-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name        = "soropool-rds-${var.environment}"
  description = "RDS security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier        = "soropool-${var.environment}"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  multi_az               = var.multi_az
  backup_retention_period = var.multi_az ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "soropool-${var.environment}-final" : null

  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name        = "soropool-rds-${var.environment}"
    Environment = var.environment
  }
}
