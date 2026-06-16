output "vpc_id" {
  value = module.vpc.vpc_id
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "rds_endpoint" {
  value = module.rds.endpoint
}

output "elasticache_endpoint" {
  value = module.elasticache.endpoint
}

output "cdn_domain" {
  value = module.cdn.domain_name
}
