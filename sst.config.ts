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

      // AdministratorAccess nécessaire pour que SST puisse créer toutes ses ressources.
      // À restreindre selon le principe du moindre privilège une fois le projet stable.
      new aws.iam.RolePolicyAttachment("GitHubActionsRolePolicy", {
        role: githubRole.name,
        policyArn: "arn:aws:iam::aws:policy/AdministratorAccess",
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
