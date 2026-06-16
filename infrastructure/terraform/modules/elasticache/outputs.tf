output "endpoint" {
  value = var.cluster_mode ? aws_elasticache_replication_group.main[0].primary_endpoint_address : aws_elasticache_cluster.main[0].cache_nodes[0].address
}

output "port" {
  value = 6379
}
