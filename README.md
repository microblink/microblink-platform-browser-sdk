<p align="center" >
  <img src="https://raw.githubusercontent.com/wiki/blinkid/blinkid-android/images/logo-microblink.png" alt="Microblink" title="Microblink">
</p>

# Microblink Platform browser SDK

The Microblink Platform browser SDK ([`@microblink/platform-sdk`](https://www.npmjs.com/package/@microblink/platform-sdk)) is a TypeScript client library which allows you to integrate Platform workflows into your web application.

This repository contains example apps for both major versions:

| Folder        | SDK version | Contents                                                         |
| ------------- | ----------- | ---------------------------------------------------------------- |
| [`v2`](v2)    | 2.x         | Vanilla JS, React and custom UI examples, an example server, and a Claude skill |
| [`v1`](v1)    | 1.x         | React, vanilla and vanilla with device-to-device examples       |

**Starting a new integration? Use v2.**

## v2

```js
import { createPlatformSdk } from "@microblink/platform-sdk";

// Your backend creates the transaction and returns a session token.
const { sessionToken } = await fetch("/api/session", { method: "POST" }).then((r) => r.json());

createPlatformSdk({ sessionToken, target: document.querySelector("#verification") });
```

That's the whole frontend integration. See [`v2/README.md`](v2/README.md) to run the examples, for the example server, for React and custom UI, and for the Claude skill that integrates the SDK into your app for you.

## v1

The v1 SDK documentation is available [here](https://platform.docs.microblink.com/sdk/web/).

### Prerequisites

To successfully run the v1 example apps, you need:

1. A [Microblink Platform account and API credentials](https://platform.docs.microblink.com/account-setup/).
2. A [workflow](https://platform.docs.microblink.com/build-workflow/). After this step, you should know your workflow ID.
3. A [transaction proxy](https://platform.docs.microblink.com/proxy) with which you can test the workflow. For testing, you can use our own [transaction proxy](https://github.com/MicroblinkPlatform/microblink-platform-transaction-proxy). After this step, you should know your transaction proxy URL.

### Run the example apps

1. Navigate to one of the example apps, e.g. `cd v1/react`.
2. Install its dependencies:
   ```
   npm install
   ```
3. Run the app:
   ```
   npm run dev
   ```

The apps will run on `localhost`, port 8080 (`v1/react`) or 3000 (`v1/vanilla`).

### Use the example apps

1. Enter your workflow ID, for example: `6870ca44335606082bb4bf90`.
2. Enter your proxy URL, for example: `http://localhost:8081/transaction`.
3. Select localization or customization options.
4. Turn [D2D](https://platform.docs.microblink.com/d2d/) on or off.
