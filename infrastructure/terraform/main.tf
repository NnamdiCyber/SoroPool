terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10"
    }
  }

  backend "s3" {
    bucket = "soropool-terraform-state"
    key    = "soropool/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_ca_cert)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_ca_cert)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

module "vpc" {
  source = "./modules/vpc"

  environment = var.environment
  vpc_cidr   = var.vpc_cidr
}

module "eks" {
  source = "./modules/eks"

  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  public_subnet_ids    = module.vpc.public_subnet_ids
  cluster_version      = "1.28"
  node_instance_types  = ["t3.medium"]
  node_min_size        = 3
  node_max_size        = 10
  node_desired_size    = 3
}

module "rds" {
  source = "./modules/rds"

  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_class    = "db.r6g.large"
  allocated_storage = 100
  multi_az          = var.environment == "prod" ? true : false
  db_name           = "soropool"
  db_username       = var.db_username
  db_password       = var.db_password
}

module "elasticache" {
  source = "./modules/elasticache"

  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  private_subnet_ids  = module.vpc.private_subnet_ids
  node_type           = "cache.r6g.large"
  cluster_mode        = var.environment == "prod" ? true : false
  num_cache_nodes     = var.environment == "prod" ? 3 : 1
}

module "cdn" {
  source = "./modules/cdn"

  environment       = var.environment
  domain_name       = var.domain_name
  alb_dns_name      = module.eks.alb_dns_name
  alb_zone_id       = module.eks.alb_zone_id
  certificate_arn   = var.certificate_arn
}
