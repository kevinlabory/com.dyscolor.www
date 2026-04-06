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

const GITHUB_REPO = "kevinlabory/com.dyscolor.www";

export default $config({
  app(input) {
    return {
      name: "dyscolor",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"],
      home: "aws",
      providers: {
        aws: {
          region: "eu-west-3",
        },
      },
    };
  },

  async run() {
    // ── OIDC + IAM (uniquement en production pour éviter les doublons) ──────
    // Le provider OIDC GitHub est une ressource globale par compte AWS.
    // Il ne doit être créé qu'une fois. Si vous en avez déjà un, remplacez
    // `new aws.iam.OpenIdConnectProvider` par `aws.iam.OpenIdConnectProvider.get`.
    if ($app.stage === "production") {
      const oidcProvider = new aws.iam.OpenIdConnectProvider(
        "GitHubOidcProvider",
        {
          url: "https://token.actions.githubusercontent.com",
          clientIdLists: ["sts.amazonaws.com"],
          // Thumbprint GitHub (stable, validé par AWS Certificate Authority)
          thumbprintLists: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
        }
      );

      // Rôle assumé par GitHub Actions via OIDC
      // Restreint au dépôt kevinlabory/com.dyscolor.www uniquement
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
                    "token.actions.githubusercontent.com:aud":
                      "sts.amazonaws.com",
                  },
                  StringLike: {
                    // Autorise toutes les branches et environnements du dépôt
                    "token.actions.githubusercontent.com:sub": `repo:${GITHUB_REPO}:*`,
                  },
                },
              },
            ],
          })
        ),
      });

      // Politique au moindre privilège : couvre exactement les services utilisés par SST
      // (S3, CloudFront, ACM, Route 53, IAM OIDC, DynamoDB lock Pulumi, SSM).
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
          ],
        }),
      });

      // Output : à copier comme variable GitHub Actions (pas un secret)
      return { githubRoleArn: githubRole.arn };
    }

    // ── Zone DNS Route 53 ────────────────────────────────────────────────────
    const zone = new aws.route53.Zone("DyscolorZone", {
      name: "dyscolor.com",
    });

    // ── Security headers CloudFront ──────────────────────────────────────────
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

    // ── Site statique ────────────────────────────────────────────────────────
    const site = new sst.aws.StaticSite("DyscolorSite", {
      build: { command: "npm run build", output: "dist" },
      indexPage: "index.html",
      errorPage: "index.html",
      domain: {
        name: "www.dyscolor.com",
        aliases: ["dyscolor.com"],
        dns: sst.aws.dns({ zone: zone.zoneId }),
      },
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
      nameservers: zone.nameServers,
      url: site.url,
    };
  },
});
