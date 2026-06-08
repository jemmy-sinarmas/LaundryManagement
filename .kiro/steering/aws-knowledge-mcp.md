---
inclusion: always
---

# AWS Knowledge MCP — Steering Guide for Laundry Palu

## What This Does

The `aws-docs` MCP server gives you access to live, authoritative AWS documentation without leaving the workspace.
Use it any time you need to verify an AWS service API, check a configuration option, or look up best practices.

## When to Activate

Trigger this MCP automatically when you encounter any of these topics:

| Topic area | Example signals |
|---|---|
| AWS services (any) | S3, EC2, RDS, Lambda, ECS, ECR, Route 53, CloudFront |
| Infrastructure-as-Code | CloudFormation, CDK, SAM, Terraform on AWS |
| Docker / container hosting | ECS, Fargate, ECR, App Runner |
| Database hosting | RDS PostgreSQL, Aurora, DynamoDB |
| Secrets / config | SSM Parameter Store, Secrets Manager |
| Networking | VPC, ALB, NLB, Security Groups |
| CI/CD | CodePipeline, CodeBuild, CodeDeploy, GitHub Actions + OIDC on AWS |
| Cost & billing | Pricing APIs, Cost Explorer, Budgets |
| IAM / Auth | IAM roles, policies, OIDC, Cognito |

## How to Use (within AI-DLC)

### During INCEPTION — Architecture Review stage
Use `search_documentation` to verify that a proposed AWS service is available in the target region and meets the project's non-functional requirements.

```
search_documentation(
  search_phrase="<service> <feature>",
  topics=["general", "reference_documentation"]
)
```

### During CONSTRUCTION — Infrastructure Design / Code Generation stages
Use `read_documentation` on the exact URL returned by search to get the authoritative API shape before writing Terraform / CDK / SQL connection strings.

```
read_documentation(url="<url from search result>")
```

### During OPERATIONS — Deployment Prep / Environment Validation
Use the MCP to verify deployment guides (e.g., RDS parameter groups, ECS task definition fields, ALB listener rules) before running `npm run migrate` or `docker compose up` on the target environment.

## Constraints Specific to This Project

- **Database**: This project targets **PostgreSQL 15** (via Docker `postgres:15-alpine` locally; AWS RDS PostgreSQL 15 in production). When searching, always include the major version.
- **Runtime**: Node.js 20 on API, Node.js 20 on Next.js web. Filter CDK/CloudFormation examples to `nodejs20.x`.
- **Region default**: `ap-southeast-1` (Singapore) unless the human specifies otherwise.
- **No ORMs**: All SQL is raw. Do not pull in AWS Amplify DataStore or Aurora Data API docs unless explicitly asked.
- **Monetary rule**: `BIGINT` whole IDR. Do not mix in AWS Billing (USD) examples with application-level money logic.

## Query Templates by Use Case

```
# Check service availability in region
search_documentation(
  search_phrase="<service> availability ap-southeast-1",
  topics=["reference_documentation"]
)

# Get RDS connection string format
search_documentation(
  search_phrase="RDS PostgreSQL 15 connection string Node.js",
  topics=["reference_documentation"]
)

# Verify ECS Fargate task definition fields
search_documentation(
  search_phrase="ECS Fargate task definition containerDefinitions",
  topics=["reference_documentation"]
)

# Docker image push to ECR
search_documentation(
  search_phrase="ECR push Docker image AWS CLI",
  topics=["reference_documentation"]
)

# CloudFormation RDS instance
search_documentation(
  search_phrase="CloudFormation AWS::RDS::DBInstance PostgreSQL",
  topics=["cloudformation"]
)
```

## AI-DLC Audit Rule

Whenever you use the AWS Knowledge MCP during Construction or Operations, log a one-line entry in `aidlc-docs/audit.md`:

```
[<timestamp>] AWS-MCP: Queried "<search phrase>" → <brief summary of finding>
```

## Installation Check

This MCP requires `uvx` (part of the `uv` Python toolchain).
To verify: run `uvx --version` in a terminal.
If missing: install via `pip install uv` or follow https://docs.astral.sh/uv/getting-started/installation/
