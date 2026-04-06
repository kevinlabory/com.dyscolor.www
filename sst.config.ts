/// <reference path="./.sst/platform/config.d.ts" />

// Content-Security-Policy
// - style-src 'unsafe-inline' : nécessaire pour les spans colorés générés dynamiquement
// - script-src 'self'         : uniquement les bundles Astro servis depuis notre origine
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

export default $config({
  app(input) {
    return {
      name: "dyscolor",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"],
      home: "aws",
      providers: {
        aws: {
          region: "eu-west-3", // Paris
        },
      },
    };
  },

  async run() {
    // CloudFront Response Headers Policy
    // Ajoute les security headers sur chaque réponse CloudFront.
    const headersPolicy = new aws.cloudfront.ResponseHeadersPolicy(
      "DyscolorSecurityHeaders",
      {
        name: `dyscolor-security-headers-${$app.stage}`,

        securityHeadersConfig: {
          // X-Content-Type-Options: nosniff
          contentTypeOptions: { override: true },

          // X-Frame-Options: DENY
          frameOptions: { frameOption: "DENY", override: true },

          // Referrer-Policy
          referrerPolicy: {
            referrerPolicy: "strict-origin-when-cross-origin",
            override: true,
          },

          // HSTS — 2 ans, includeSubDomains, preload
          strictTransportSecurity: {
            accessControlMaxAgeSec: 63_072_000,
            includeSubdomains: true,
            preload: true,
            override: true,
          },
        },

        customHeadersConfig: {
          items: [
            {
              header: "Content-Security-Policy",
              value: CSP,
              override: true,
            },
            {
              // Désactive l'accès caméra/micro/géoloc/paiement inutiles
              header: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=(), payment=()",
              override: true,
            },
          ],
        },
      }
    );

    new sst.aws.StaticSite("DyscolorSite", {
      build: {
        command: "npm run build",
        output: "dist",
      },
      indexPage: "index.html",
      errorPage: "index.html",
      domain: {
        name: "dyscolor.com",
        aliases: ["www.dyscolor.com"],
      },

      transform: {
        cdn: (args) => {
          // Attache la policy de headers à tous les comportements CloudFront
          args.defaultCacheBehavior = {
            ...(args.defaultCacheBehavior as object),
            responseHeadersPolicyId: headersPolicy.id,
          } as typeof args.defaultCacheBehavior;
        },
      },
    });
  },
});
