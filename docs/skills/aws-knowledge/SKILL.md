# Skill: `aws-knowledge`

## Triggers
**Activates when:** AWS deployment, infrastructure, RDS, ECS, ECR, S3, CloudFormation, CDK, VPC, IAM, ALB, Route 53, Fargate, Secrets Manager, SSM, CI/CD on AWS, container registry, cloud hosting.

---

## Overview

This skill governs how to use the **AWS Knowledge MCP** (`aws-docs` server) within the Laundry Palu AI-DLC workflow. It ensures every AWS decision is backed by live, authoritative documentation rather than hallucinated API shapes or outdated examples.

---

## Project AWS Context

| Concern | Value |
|---|---|
| Default region | `ap-southeast-1` (Singapore) |
| DB engine | PostgreSQL 15 (RDS or Docker `postgres:15-alpine`) |
| API runtime | Node.js 20 (Fastify 4) |
| Web runtime | Node.js 20 (Next.js 14) |
| Container registry | ECR |
| Orchestration | ECS Fargate (production) |
| Secrets | SSM Parameter Store or Secrets Manager |
| DNS / TLS | Route 53 + ACM |
| CI/CD | GitHub Actions + OIDC → AWS IAM role |

---

## Workflow: How to Use This Skill

### Step 1 — Search first, code second

Before writing any AWS resource (CloudFormation, CDK, docker-compose override, `.env` variable), run a targeted search:

```
search_documentation(
  search_phrase="<service> <specific feature or API>",
  topics=["reference_documentation"]   // or "cloudformation", "cdk_docs", "general"
)
```

Rule: **never invent an AWS API field**. If you are unsure, search.

### Step 2 — Read the top result

```
read_documentation(url="<url from search result>")
```

Extract the exact field names, required vs optional parameters, and any region-specific caveats.

### Step 3 — Apply & log

Write the code or config using only field names confirmed by the docs.

Log in `aidlc-docs/audit.md`:
```
[YYYY-MM-DDTHH:MM] AWS-MCP: Queried "<phrase>" → <one-line finding>
```

---

## Common Queries for This Project

### RDS PostgreSQL 15

```
search_documentation(
  search_phrase="RDS PostgreSQL 15 parameter group Node.js ssl",
  topics=["reference_documentation"]
)
```

Key fields to confirm: `DBInstanceClass`, `EngineVersion`, `MultiAZ`, `StorageEncrypted`, `VPCSecurityGroups`.

### ECS Fargate task definition

```
search_documentation(
  search_phrase="ECS Fargate task definition containerDefinitions environment secrets",
  topics=["reference_documentation"]
)
```

Key fields to confirm: `cpu`, `memory`, `networkMode` (must be `awsvpc`), `executionRoleArn`, `taskRoleArn`.

### ECR image push

```
search_documentation(
  search_phrase="ECR authenticate Docker push image lifecycle policy",
  topics=["reference_documentation"]
)
```

### ALB listener rule + HTTPS redirect

```
search_documentation(
  search_phrase="ALB listener HTTPS redirect rule CloudFormation",
  topics=["cloudformation"]
)
```

### SSM Parameter Store — Node.js SDK

```
search_documentation(
  search_phrase="SSM Parameter Store GetParameter Node.js SDK v3",
  topics=["reference_documentation"]
)
```

### IAM OIDC GitHub Actions

```
search_documentation(
  search_phrase="IAM OIDC identity provider GitHub Actions AssumeRoleWithWebIdentity",
  topics=["reference_documentation"]
)
```

### CloudFormation RDS instance

```
search_documentation(
  search_phrase="CloudFormation AWS::RDS::DBInstance PostgreSQL 15",
  topics=["cloudformation"]
)
```

---

## Do / Do Not

| Do | Do Not |
|---|---|
| Search before writing any AWS resource | Invent field names from memory |
| Include the major version when searching DB/runtime docs | Mix Aurora Data API docs with raw-SQL patterns |
| Use `ap-southeast-1` as default region filter | Use Amplify DataStore (not applicable here) |
| Log every MCP query in `audit.md` | Skip audit log during Construction/Operations |
| Check regional availability before adding a new service | Assume a service is available in Singapore |

---

## AI-DLC Integration Points

| Phase | Stage | Use MCP for |
|---|---|---|
| INCEPTION | Architecture Review | Confirm service availability + pricing estimate |
| CONSTRUCTION | Infrastructure Design | Get exact CloudFormation / CDK resource schemas |
| CONSTRUCTION | Code Generation | Verify SDK method signatures (aws-sdk v3) |
| CONSTRUCTION | Build & Test | Check IAM permissions needed for integration tests |
| OPERATIONS | Deployment Prep | Confirm migration runbook (RDS parameter group changes) |
| OPERATIONS | Post-Deploy Verification | Verify health-check paths (ALB target group settings) |

---

## Installation Prerequisite

This skill requires `uvx` from the `uv` Python toolchain.

```bash
# Check
uvx --version

# Install if missing
pip install uv
# or follow: https://docs.astral.sh/uv/getting-started/installation/
```

The MCP server (`awslabs.aws-documentation-mcp-server`) is downloaded and run automatically by `uvx` — no separate install step needed.
