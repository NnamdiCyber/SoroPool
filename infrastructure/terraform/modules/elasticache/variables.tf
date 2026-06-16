variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "node_type" {
  type = string
  default = "cache.r6g.large"
}

variable "cluster_mode" {
  type = bool
  default = false
}

variable "num_cache_nodes" {
  type = number
  default = 1
}
