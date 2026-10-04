variable "region" {
  type    = string
  default = "eu-west-2" # London
}

variable "github_repo" {
  description = "GitHub repository allowed to deploy, in owner/repo format"
  type        = string
}

variable "create_oidc_provider" {
  description = "Set to false if a GitHub OIDC provider already exists in this account"
  type        = bool
  default     = true
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}
