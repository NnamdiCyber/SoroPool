variable "environment" {
  type = string
}

variable "domain_name" {
  type = string
  default = ""
}

variable "alb_dns_name" {
  type = string
}

variable "alb_zone_id" {
  type = string
}

variable "certificate_arn" {
  type = string
  default = ""
}
