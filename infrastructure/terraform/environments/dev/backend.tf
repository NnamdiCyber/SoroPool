terraform {
  backend "s3" {
    bucket = "soropool-terraform-state"
    key    = "soropool/dev/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = "us-east-1"
}
