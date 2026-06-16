output "cluster_endpoint" {
  value = aws_eks_cluster.main.endpoint
}

output "cluster_name" {
  value = aws_eks_cluster.main.name
}

output "cluster_ca_cert" {
  value = aws_eks_cluster.main.certificate_authority[0].data
}

output "alb_dns_name" {
  value = ""
}

output "alb_zone_id" {
  value = ""
}
