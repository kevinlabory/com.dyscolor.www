/// <reference path="./.sst/platform/config.d.ts" />

// Content-Security-Policy
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const GITHUB_REPO      = "kevinlabory/com.dyscolor.www";
const ALERT_EMAIL      = "kevinlabory@gmail.com";
const BUDGET_LIMIT_USD = "10"; // $10/mois — alerte à 80 %, blocage à 100 %

export default $config({
  app(input) {
    return {
      name: "dyscolor",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
      home: "aws",
      providers: {
        aws: { region: "eu-west-3" },
      },
    };
  },

  async run() {
    const isProd = $app.stage === "production";
    let githubRoleArn: $util.Output<string> | undefined;

    // ── OIDC + IAM + Budget (production uniquement) ──────────────────────────
    if (isProd) {

      // — OIDC Provider GitHub ------------------------------------------------
      // Ressource globale par compte : ne créer qu'une fois.
      // Si un provider existe déjà, remplacer `new` par
      // `aws.iam.OpenIdConnectProvider.get("GitHubOidcProvider", existingArn)`.
      const oidcProvider = new aws.iam.OpenIdConnectProvider(
        "GitHubOidcProvider",
        {
          url: "https://token.actions.githubusercontent.com",
          clientIdLists: ["sts.amazonaws.com"],
          thumbprintLists: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
        }
      );

      // — Rôle GitHub Actions (assumé via OIDC) --------------------------------
      const githubRole = new aws.iam.Role("GitHubActionsRole", {
        name: "dyscolor-github-actions",
        assumeRolePolicy: oidcProvider.arn.apply((arn) =>
          JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { Federated: arn },
                Action: "sts:AssumeRoleWithWebIdentity",
                Condition: {
                  StringEquals: {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
                  },
                  StringLike: {
                    "token.actions.githubusercontent.com:sub": `repo:${GITHUB_REPO}:*`,
                  },
                },
              },
            ],
          })
        ),
      });

      // Politique au moindre privilège : uniquement les services utilisés par SST
      new aws.iam.RolePolicy("GitHubActionsPolicy", {
        role: githubRole.name,
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "S3",
              Effect: "Allow",
              Action: [
                "s3:CreateBucket", "s3:DeleteBucket",
                "s3:GetBucketLocation", "s3:ListAllMyBuckets",
                "s3:GetBucketPolicy", "s3:PutBucketPolicy", "s3:DeleteBucketPolicy",
                "s3:GetBucketVersioning", "s3:PutBucketVersioning",
                "s3:GetBucketWebsite", "s3:PutBucketWebsite", "s3:DeleteBucketWebsite",
                "s3:GetBucketCORS", "s3:PutBucketCORS",
                "s3:GetBucketPublicAccessBlock", "s3:PutBucketPublicAccessBlock",
                "s3:GetBucketOwnershipControls", "s3:PutBucketOwnershipControls",
                "s3:GetBucketTagging", "s3:PutBucketTagging",
                "s3:GetBucketAcl", "s3:PutBucketAcl",
                "s3:GetEncryptionConfiguration", "s3:PutEncryptionConfiguration",
                "s3:GetLifecycleConfiguration", "s3:PutLifecycleConfiguration",
                "s3:ListBucket", "s3:ListBucketVersions",
                "s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:DeleteObjectVersion",
                "s3:GetObjectTagging", "s3:PutObjectTagging",
              ],
              Resource: "*",
            },
            {
              Sid: "CloudFront",
              Effect: "Allow",
              Action: [
                "cloudfront:CreateDistribution", "cloudfront:UpdateDistribution",
                "cloudfront:DeleteDistribution", "cloudfront:GetDistribution",
                "cloudfront:GetDistributionConfig", "cloudfront:ListDistributions",
                "cloudfront:TagResource", "cloudfront:UntagResource",
                "cloudfront:ListTagsForResource",
                "cloudfront:CreateOriginAccessControl",
                "cloudfront:UpdateOriginAccessControl",
                "cloudfront:DeleteOriginAccessControl",
                "cloudfront:GetOriginAccessControl",
                "cloudfront:GetOriginAccessControlConfig",
                "cloudfront:ListOriginAccessControls",
                "cloudfront:CreateCachePolicy", "cloudfront:UpdateCachePolicy",
                "cloudfront:DeleteCachePolicy", "cloudfront:GetCachePolicy",
                "cloudfront:GetCachePolicyConfig", "cloudfront:ListCachePolicies",
                "cloudfront:CreateResponseHeadersPolicy",
                "cloudfront:UpdateResponseHeadersPolicy",
                "cloudfront:DeleteResponseHeadersPolicy",
                "cloudfront:GetResponseHeadersPolicy",
                "cloudfront:ListResponseHeadersPolicies",
                "cloudfront:CreateInvalidation",
                "cloudfront:GetInvalidation", "cloudfront:ListInvalidations",
              ],
              Resource: "*",
            },
            {
              Sid: "ACM",
              Effect: "Allow",
              Action: [
                "acm:RequestCertificate", "acm:DescribeCertificate",
                "acm:DeleteCertificate", "acm:GetCertificate",
                "acm:ListCertificates",
                "acm:AddTagsToCertificate", "acm:ListTagsForCertificate",
              ],
              Resource: "*",
            },
            {
              Sid: "Route53",
              Effect: "Allow",
              Action: [
                "route53:CreateHostedZone", "route53:GetHostedZone",
                "route53:DeleteHostedZone",
                "route53:ListHostedZones", "route53:ListHostedZonesByName",
                "route53:ChangeResourceRecordSets",
                "route53:GetChange", "route53:ListResourceRecordSets",
                "route53:ChangeTagsForResource", "route53:ListTagsForResource",
              ],
              Resource: "*",
            },
            {
              Sid: "IAMOidc",
              Effect: "Allow",
              Action: [
                "iam:CreateOpenIDConnectProvider",
                "iam:UpdateOpenIDConnectProviderThumbprint",
                "iam:DeleteOpenIDConnectProvider",
                "iam:GetOpenIDConnectProvider",
                "iam:ListOpenIDConnectProviders",
                "iam:TagOpenIDConnectProvider",
                "iam:CreateRole", "iam:UpdateRole", "iam:DeleteRole",
                "iam:GetRole", "iam:ListRoles",
                "iam:TagRole", "iam:UntagRole", "iam:ListRoleTags",
                "iam:GetRolePolicy", "iam:PutRolePolicy", "iam:DeleteRolePolicy",
                "iam:ListRolePolicies",
                "iam:AttachRolePolicy", "iam:DetachRolePolicy",
                "iam:ListAttachedRolePolicies",
                "iam:PassRole",
                // Managed policies (nécessaire pour la politique deny-all du budget)
                "iam:CreatePolicy", "iam:GetPolicy", "iam:GetPolicyVersion",
                "iam:DeletePolicy", "iam:ListPolicyVersions", "iam:TagPolicy",
                "iam:ListEntitiesForPolicy",
              ],
              Resource: "*",
            },
            {
              Sid: "DynamoDBPulumiLock",
              Effect: "Allow",
              Action: [
                "dynamodb:CreateTable", "dynamodb:DescribeTable", "dynamodb:DeleteTable",
                "dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:DeleteItem",
                "dynamodb:UpdateItem", "dynamodb:Scan", "dynamodb:Query",
                "dynamodb:DescribeTimeToLive", "dynamodb:UpdateTimeToLive",
                "dynamodb:TagResource", "dynamodb:ListTagsOfResource",
              ],
              Resource: "*",
            },
            {
              Sid: "SSMParameters",
              Effect: "Allow",
              Action: [
                "ssm:PutParameter", "ssm:GetParameter",
                "ssm:GetParameters", "ssm:GetParametersByPath",
                "ssm:DeleteParameter", "ssm:DescribeParameters",
                "ssm:AddTagsToResource", "ssm:ListTagsForResource",
              ],
              Resource: "*",
            },
            {
              Sid: "Budgets",
              Effect: "Allow",
              // budgets:* est sans risque : ce service ne peut que lire/écrire
              // des budgets, pas accéder aux autres ressources AWS.
              Action: ["budgets:*"],
              Resource: "*",
            },
          ],
        }),
      });

      githubRoleArn = githubRole.arn;

      // — Budget mensuel -------------------------------------------------------

      // 1. Politique deny-all attachée au rôle GitHub Actions si 100 % dépassé.
      //    Cela bloque les nouveaux déploiements mais ne détruit pas l'infra
      //    existante (CloudFront/S3 continuent de servir le site).
      const denyPolicy = new aws.iam.Policy("BudgetDenyPolicy", {
        name: "dyscolor-budget-deny-all",
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [{ Effect: "Deny", Action: "*", Resource: "*" }],
        }),
      });

      // 2. Rôle d'exécution que le service Budgets utilise pour attacher/détacher
      //    la politique deny-all.
      const budgetsExecRole = new aws.iam.Role("BudgetsExecutionRole", {
        name: "dyscolor-budgets-execution",
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { Service: "budgets.amazonaws.com" },
              Action: "sts:AssumeRole",
            },
          ],
        }),
      });

      new aws.iam.RolePolicy("BudgetsExecutionPolicy", {
        role: budgetsExecRole.name,
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["iam:AttachRolePolicy", "iam:DetachRolePolicy"],
              Resource: "*",
            },
          ],
        }),
      });

      // 3. Budget : alerte email à 80 %, alerte email à 100 %
      const budget = new aws.budgets.Budget("DyscolorBudget", {
        name: "dyscolor-monthly",
        budgetType: "COST",
        limitAmount: BUDGET_LIMIT_USD,
        limitUnit: "USD",
        timeUnit: "MONTHLY",
        notifications: [
          {
            comparisonOperator: "GREATER_THAN",
            notificationType: "ACTUAL",
            threshold: 80,
            thresholdType: "PERCENTAGE",
            subscriberEmailAddresses: [ALERT_EMAIL],
          },
          {
            comparisonOperator: "GREATER_THAN",
            notificationType: "ACTUAL",
            threshold: 100,
            thresholdType: "PERCENTAGE",
            subscriberEmailAddresses: [ALERT_EMAIL],
          },
        ],
      });

      // 4. Action automatique : applique deny-all au rôle GitHub Actions à 100 %
      new aws.budgets.BudgetAction("BudgetDenyAction", {
        budgetName: budget.name,
        actionType: "APPLY_IAM_POLICY",
        approvalModel: "AUTOMATIC",
        notificationType: "ACTUAL",
        executionRoleArn: budgetsExecRole.arn,
        actionThreshold: {
          actionThresholdType: "PERCENTAGE",
          actionThresholdValue: 100,
        },
        definition: {
          iamActionDefinition: {
            policyArn: denyPolicy.arn,
            roles: [githubRole.name],
          },
        },
        subscribers: [{ address: ALERT_EMAIL, subscriptionType: "EMAIL" }],
      });
    }

    // ── Zone DNS (production uniquement — pas nécessaire en dev) ─────────────
    const zone = isProd
      ? new aws.route53.Zone("DyscolorZone", { name: "dyscolor.com" })
      : undefined;

    // ── Security headers CloudFront (tous les stages) ────────────────────────
    const headersPolicy = new aws.cloudfront.ResponseHeadersPolicy(
      "DyscolorSecurityHeaders",
      {
        name: `dyscolor-security-headers-${$app.stage}`,
        securityHeadersConfig: {
          contentTypeOptions: { override: true },
          frameOptions: { frameOption: "DENY", override: true },
          referrerPolicy: {
            referrerPolicy: "strict-origin-when-cross-origin",
            override: true,
          },
          strictTransportSecurity: {
            accessControlMaxAgeSec: 63_072_000,
            includeSubdomains: true,
            preload: true,
            override: true,
          },
        },
        customHeadersConfig: {
          items: [
            { header: "Content-Security-Policy", value: CSP, override: true },
            {
              header: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=(), payment=()",
              override: true,
            },
          ],
        },
      }
    );

    // ── Site statique (tous les stages) ──────────────────────────────────────
    const site = new sst.aws.StaticSite("DyscolorSite", {
      build: { command: "npm run build", output: "dist" },
      indexPage: "index.html",
      errorPage: "index.html",
      // Domaine personnalisé uniquement en production
      ...(isProd && zone
        ? {
            domain: {
              name: "www.dyscolor.com",
              aliases: ["dyscolor.com"],
              dns: sst.aws.dns({ zone: zone.zoneId }),
            },
          }
        : {}),
      transform: {
        cdn: (args) => {
          args.defaultCacheBehavior = {
            ...(args.defaultCacheBehavior as object),
            responseHeadersPolicyId: headersPolicy.id,
          } as typeof args.defaultCacheBehavior;
        },
      },
    });

    return {
      url: site.url,
      ...(zone ? { nameservers: zone.nameServers } : {}),
      ...(githubRoleArn ? { githubRoleArn } : {}),
    };
  },
});
