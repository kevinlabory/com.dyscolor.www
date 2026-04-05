/// <reference path="./.sst/platform/config.d.ts" />

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
    new sst.aws.StaticSite("DyscolorSite", {
      build: {
        command: "npm run build",
        output: "dist",
      },
      // Uncomment and set your domain once DNS is configured in Route 53:
      // domain: {
      //   name: "dyscolor.com",
      //   aliases: ["www.dyscolor.com"],
      // },
      indexPage: "index.html",
      errorPage: "index.html",
    });
  },
});
