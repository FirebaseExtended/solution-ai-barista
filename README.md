# AI Barista: Agent-powered Barista App

This is a demo app that shows how to build an agent-driven beverage ordering system using Firebase and Google Cloud.

AI Barista is an intelligent chatbot application designed to simulate a coffee shop ordering experience. Users can interact with an AI agent to place beverage orders, ask for recommendations, and confirm their selections.

*This project is intended for demonstration purposes only. It is not
intended for use in a production environment.*

## Try it out today

We recommend trying out this project in Project IDX. Click this button to launch the project in Project IDX and follow the steps below to get started.

<a href="https://idx.google.com/import?url=https%3A%2F%2Fgithub.com%2FFirebaseExtended%2Fsolution-ai-barista">
  <picture>
    <source
      media="(prefers-color-scheme: dark)"
      srcset="https://cdn.idx.dev/btn/try_dark_32.svg">
    <source
      media="(prefers-color-scheme: light)"
      srcset="https://cdn.idx.dev/btn/try_light_32.svg">
    <img
      height="32"
      alt="Try in IDX"
      src="https://cdn.idx.dev/btn/try_purple_32.svg">
  </picture>
</a>

### Prerequisites

1. A new Firebase project
1. [Activate billing on your Google Cloud / Firebase Project](https://console.cloud.google.com/billing/linkedaccount?project=_)
1. [Enable the Anonymous authentication sign-in method](https://firebase.google.com/docs/auth/web/anonymous-auth#before-you-begin) for your project.
   1. You may chose to upgrade your project and enable automatic clean-up of old accounts.
1. Create a default Firestore database by navigating to **Firestore** in the console.
1. [Enable Vertex AI and recommended APIs](https://console.cloud.google.com/vertex-ai) in the Google Cloud console.

### Getting started in Project IDX

1. Open the project in Project IDX.
1. When prompted, select your Firebase project.
1. Log into Firebase Hosting. Navigate to the "Project IDX" screen and select "Authenticate". Follow the prompts in the terminal.
1. Prepare your Firebase project by setting up security rules, TTL configuration and functions for cleaning up data:
   1. Select a Firebase project: `firebase use`.
   2. Deploy Firestore, Storage and Functions: `firebase deploy --only firestore,storage,functions`
   3. Follow any additional prompts to set up access and grant permissions.
   4. You may need to grant the *Logs Writer* permission.
1. Configure Firebase for the Angular frontend app.
   1. Navigate to the Firebase console, create a new web client and donwload the configuration file for your project.
   1. Add the configuration into the file `client/web/angular-customer-app/src/environments/environment.development.ts`.
1. The app is now ready! Switch to the **Web Preview** to see it in action.

### Getting started locally

You can run the application locally and access Firebase and Google Cloud directly.

#### Local Prerequisites

1. Set up the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install-sdk).
1. Set up the [Firebase CLI](https://firebase.google.com/docs/cli).
1. Set up [Application Default Credentials (ADC) for a local development environment](https://cloud.google.com/docs/authentication/set-up-adc-local-dev-environment)

Follow the steps in [services/cloud-run](services/cloud-run), [client/web/angular-customer-app](client/web/angular-customer-app) and [services/local-recommendation](services/local-recommendation) to run each component.

## Demo and code overview

This project consists of two main parts:

* [client/web/angular-customer-app](client/web/angular-customer-app/): The frontend customer ordering app, built with Angular.
* [services/cloud-run/](services/cloud-run/): The backend, built with Genkit, Vertex AI, Firestore, Clound Run and Cloud Storage for Firebase.

Two additional systems provide some additional services:

* [services/functions](services/functions/): Cloud Functions for Firebase to handle clean up of data stored in Cloud Storage.
* [services/local-recommendation](services/local-recommendation/): A simple HTTP-service that returns a drink recommendation from a fixed list of beverages.

## Demo walkthrough and examples

Once the application is up and running, talk to the agent to assemble and submit a beverage order.

Here are some example messages to try.

### Orders

```text
I want to order a latte with oat milk and double shots.
Add 1 latte, regular milk, 1 shot, no sweeteners to the order.
Order a cappucino with almond milk and extra sugar.
I'd like a decaf almond cappuccino, double shots with chocolate sauce.
Add a cortado with with quadruple shots, iced, regular milk and a Matcha Latte with extra foam, hazelnut sauce and sugar free vanilla sweetener.
Order 1 latte with oat milk, 2 shots and a latte, regular milk, 1 shot with sugar.
```

### Updating orders

```text
Actually, instead of the Latte I'd like an espresso. Make it extra hot.
I want oat milk instead.
Clear my order and let me start again.
```

### Order submission and status check

```text
What's my order?
Submit my order
```

## Deploying the app

You can deploy the backend and the frontend directly from Project IDX. Follow the on the "Project IDX" screen to deploy the app to Google Cloud Run and Firebase Hosting.

Don't forget to deploy Cloud Functions and the Storage and Firestore configurations:

```bash
firebase deploy --only firestore,storage,functions
```

See [services/cloud-run](services/cloud-run) and [client/web/angular-customer-app](client/web/angular-customer-app) for more details and manual deployment steps.

## Additional Information

This app is not an officially supported Google Product.
