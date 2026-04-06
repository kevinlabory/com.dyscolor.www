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
    // ── Zone DNS Route 53 ───────────────────────────────────────────────────
    // Créée en IaC. Après le premier `sst deploy`, copiez les nameservers
    // affichés dans l'output "nameservers" vers OVH (Domaines → Serveurs DNS).
    const zone = new aws.route53.Zone("DyscolorZone", {
      name: "dyscolor.com",
    });

    // ── Security headers CloudFront ─────────────────────────────────────────
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
              header: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=(), payment=()",
              override: true,
            },
          ],
        },
      }
    );

    // ── Site statique ───────────────────────────────────────────────────────
    const site = new sst.aws.StaticSite("DyscolorSite", {
      build: {
        command: "npm run build",
        output: "dist",
      },
      indexPage: "index.html",
      errorPage: "index.html",
      domain: {
        name: "www.dyscolor.com",   // domaine principal
        aliases: ["dyscolor.com"],  // apex redirigé vers www
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

    // ── Outputs ─────────────────────────────────────────────────────────────
    return {
      // Copiez ces 4 nameservers dans OVH après le premier déploiement
      nameservers: zone.nameServers,
      url: site.url,
    };
  },
});
