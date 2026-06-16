resource "aws_elasticache_subnet_group" "main" {
  name       = "soropool-${var.environment}"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "redis" {
  name        = "soropool-redis-${var.environment}"
  description = "Redis security group"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
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

resource "aws_elasticache_replication_group" "main" {
  count = var.cluster_mode ? 1 : 0

  replication_group_id = "soropool-${var.environment}"
  description          = "SoroPool Redis cluster ${var.environment}"
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_nodes
  port                 = 6379

  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  multi_az_enabled           = var.num_cache_nodes > 1
  engine                     = "redis"
  engine_version             = "7.0"
  parameter_group_name       = "default.redis7.cluster.on"

  tags = {
    Name        = "soropool-redis-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_elasticache_cluster" "main" {
  count = var.cluster_mode ? 0 : 1

  cluster_id           = "soropool-${var.environment}"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = "default.redis7"
  port                 = 6379

  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  tags = {
    Name        = "soropool-redis-${var.environment}"
    Environment = var.environment
  }
}
