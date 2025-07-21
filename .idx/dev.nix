# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-25.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
     pkgs.nodejs_24
     pkgs.jdk24
     pkgs.nodePackages.nodemon
  ];


  # Sets environment variables in the workspace
  env = {
   # Enable AppCheck for additional security for critical endpoints.
   # Follow the configuration steps in the README to set up your project.
   # ENABLE_APPCHECK = "TRUE";
   LOCAL_RECOMMENDATION_SERVICE = "http://127.0.0.1:8084";
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
     "ms-vscode.js-debug"
     "angular.ng-template"
    ];

    # Workspace lifecycle hooks
    workspace = {
      onCreate = {
        # Set up the backend API and install dependencies
        api-install = "cd services/cloud-run && npm run build:update-libs && npm ci --no-audit --prefer-offline --no-progress --timing";
        npm-install = "cd client/web/angular-customer-app && npm ci --no-audit --prefer-offline --no-progress --timing || npm i --no-audit --no-progress --timing";
        npm-install-recommendation = "cd services/local-recommendation && npm ci --no-audit --prefer-offline --no-progress --timing";
        npm-install-functions = "cd services/functions && npm ci --no-audit --prefer-offline --no-progress --timing";

         default.openFiles = [
          # Open the entry point for the backend API.
          "services/cloud-run/src/index.ts"
          # Open the entry point for the Angular Client app.
          "src/app/app.component.ts"
         ];
      };
      # Runs when the workspace is (re)started
      onStart = {
        # Start the backend API for development.
        local-recommendation = "cd services/local-recommendation && npm run dev";
        api-run = "cd services/cloud-run && npm run build:update-libs && npm run genkit:dev";
      };
    };

    # Enable previews
    previews = {
      enable = true;
      previews = {
        web = {
          # Run "npm run dev" with PORT set to Firebase Studio's defined port for previews,
          # and show it in the web preview panel
          cwd = "client/web/angular-customer-app";
          command = ["npm" "run" "start" "--" "--port" "$PORT" "--host" "0.0.0.0" "--disable-host-check"];
          manager = "web";
          env = {
            # Environment variables to set for your server
            PORT = "$PORT";
          };
        };
      };
    };
  };
}
