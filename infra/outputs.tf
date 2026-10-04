# Add these values to GitHub → Settings → Environments → production → Variables
output "AWS_REGION" { value = var.region }
output "AWS_DEPLOY_ROLE_ARN" { value = aws_iam_role.github_deploy.arn }
output "ECR_REPOSITORY" { value = aws_ecr_repository.app.name }
output "EC2_INSTANCE_ID" { value = aws_instance.app.id }
output "LOG_GROUP" { value = aws_cloudwatch_log_group.app.name }
output "APP_URL" { value = "http://${aws_eip.app.public_ip}" }
