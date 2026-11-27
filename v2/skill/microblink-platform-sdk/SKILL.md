---
name: microblink-platform-sdk
description: Integrate Microblink Platform identity verification (@microblink/platform-sdk v2) into a web app. Use when the user wants to add ID verification, document scanning, selfie/face capture or KYC with Microblink Platform, or asks to set up, customize or debug @microblink/platform-sdk.
---

# Integrate Microblink Platform SDK v2

You are adding identity verification to the user's web app with `@microblink/platform-sdk` (v2). Reference examples: https://github.com/MicroblinkPlatform/microblink-platform-browser-sdk/tree/main/v2

## How it works (keep this model in mind)

1. **Backend** creates a transaction with the organisation's API credentials and returns `sdkConfiguration` (the **session token**) to the browser. Credentials never reach the browser.
2. **Browser** calls `createPlatformSdk({ sessionToken })` (or the React hook). The SDK runs every step of the workflow configured on the platform and renders a default UI for each.
3. The app listens for the outcome (`Accept`, `Reject` or `Review`).

The SDK never creates transactions and never asks for consent: consent is recorded by the backend when it creates the transaction.

## Steps

### 1. Inspect the project first

Find the framework (React, vanilla, Vue, Svelte, Next.js, ...), the bundler (Vite or other), and the backend (Express, Next.js route handlers, Fastify, ...). Reuse what exists. Ask the user only for what you can't find: which page should start the verification, and where the backend lives if there is none.

### 2. Install

```sh
npm install @microblink/platform-sdk
```

### 3. Backend endpoint

Add one endpoint (e.g. `POST /api/session`) in the user's backend. Read credentials from environment variables, never hard-code them, and never prefix them with `VITE_`, `NEXT_PUBLIC_` or anything else that ships them to the browser.

```js
const response = await fetch(`${process.env.AGENT_API_URL}/transaction`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString("base64")}`,
  },
  body: JSON.stringify({
    workflowId: process.env.WORKFLOW_ID,
    platform: "Browser",
    consent: { userId: currentUser.id, isProcessingStoringAllowed: true, givenOn: new Date() },
  }),
});
const { sdkConfiguration } = await response.json();
// respond with { sessionToken: sdkConfiguration }
```

Use the signed-in user's id for `consent.userId`. Add `AGENT_API_URL`, `CLIENT_ID`, `CLIENT_SECRET`, `WORKFLOW_ID` to `.env.example` (empty values) and make sure `.env` is git-ignored.

### 4. Camera resources

Document, card and face steps load WASM files from `resources/` next to the page. Each capability has its own set of files:

| `--only` value | Workflow steps                            | Size   |
| -------------- | ----------------------------------------- | ------ |
| `document`     | Document scan / document verification     | ~95 MB |
| `card`         | Payment card scan                         | ~30 MB |
| `face`         | Selfie / face capture                     | ~5 MB  |

**Ask the user which capabilities their workflows use.** The workflow is configured on the platform, so you can't tell from the code. If they know, copy only those. If they don't, copy all three, and tell them they can trim it later with `--only`. A step whose files are missing fails when its camera starts.

- **Only some capabilities (any bundler, Vite included)**: run the command before dev and build, into the public/static folder:
  ```json
  {
    "scripts": {
      "predev": "platform-web-sdk copy-resources public --only document,face",
      "prebuild": "platform-web-sdk copy-resources public --only document,face"
    }
  }
  ```
- **All capabilities with Vite**: the plugin is simpler. It always copies all three, so don't use it when trimming.
  ```ts
  import { scanResourcesPlugin } from "@microblink/platform-sdk/vite";
  export default defineConfig({ plugins: [...scanResourcesPlugin()] });
  ```
- **All capabilities, other bundlers**: the same command as above, without `--only`.

Add `public/resources` to `.gitignore` (up to ~130 MB, regenerated on each build). To serve them from a CDN or another path, set `resourcesPath` to the folder that **contains** `resources/`.

### 5. Frontend

**Vanilla / any framework**

```js
import { createPlatformSdk } from "@microblink/platform-sdk";

const { sessionToken } = await fetch("/api/session", { method: "POST" }).then((r) => r.json());
const sdk = createPlatformSdk({ sessionToken, target: document.querySelector("#verification") });

sdk.onTransactionEnd(({ verificationStatus, transactionId }) => { /* "Accept" | "Reject" | "Review" */ });
sdk.onAbort(({ step }) => { /* user quit */ });
sdk.onUnmount(() => { /* SDK UI removed: show your own next screen */ });
```

`target` must have a height. Without `target`, the SDK renders a full-screen overlay. In frameworks with components (Vue, Svelte, Angular), create the SDK when the component mounts and call `sdk.destroy()` when it unmounts.

**React**

```tsx
import { PlatformFlowUI, usePlatformSdk } from "@microblink/platform-sdk/react";

function Verification({ sessionToken }: { sessionToken: string }) {
  const sdk = usePlatformSdk({ sessionToken });
  
  if (sdk.unmounted) return <p>Done</p>;
  
  return <PlatformFlowUI config={sdk} />;
}
```

Mount `<Verification>` only once you have the token. `usePlatformSdk` reads its config once, on mount; to start again, remount with a new token. With Next.js, render it in a client component (`"use client"`).

### 6. Optional: custom UI

Any non-camera step can be replaced with the app's own components. In React, branch on `sdk.currentStep` (this narrows `sdk.state` and the actions) and fall through to `<PlatformFlowUI />`:

```tsx
if (sdk.currentStep === "END") return <MyResult status={sdk.state.verificationStatus} onFinish={sdk.finish} />;
if (sdk.currentStep === "MANUAL_INPUT") return <MyForm fields={sdk.state.formFields} onSubmit={sdk.next} />;
return <PlatformFlowUI config={sdk} />;
```

Vanilla: `sdk.onStep("END", (state, { finish }) => { /* render into your container */ })`.

Overridable: `PROGRESS_OVERVIEW`, `MANUAL_INPUT`, `DOCUMENT_UPLOAD`, `END`, `ERROR`, `LOADING`, `CAMERA_UNAVAILABLE` and the `D2D_*` steps. **Never** the camera steps (`DOCUMENT_SCAN`, `DOCUMENT_VERIFICATION`, `CARD_SCAN`, `FACE_CAPTURE`): keep `<PlatformFlowUI />` mounted for them. Match the camera screens to the brand with `theme: { accent, fontFamily, buttonBorderRadius }`.

`MANUAL_INPUT` submit: `next({ formValues, files })`, where `formValues` is keyed by field name with `null` for empty and `"true"`/`"false"` for booleans, and `files` maps field names to `{ fileName, contentType, rawImage: Uint8Array }`.

Full example: https://github.com/MicroblinkPlatform/microblink-platform-browser-sdk/tree/main/v2/custom-ui

### 7. Other options

`translations` (partial string overrides by screen), `theme.icons`, and `runAddress` (self-hosted page for continuing on a phone; must be HTTPS). Full reference: the package README in `node_modules/@microblink/platform-sdk/README.md`. Read it before using anything not shown here.

## Checklist before you finish

- [ ] Credentials are only in backend env vars, not in any client bundle or committed file.
- [ ] The browser gets only the session token.
- [ ] Camera resources are copied (Vite plugin or `copy-resources`), and `public/resources` is git-ignored.
- [ ] Only the capabilities the workflows use are copied (`--only`). If you copied all three because the user didn't know, tell them they can trim it.
- [ ] The SDK container has a height.
- [ ] The outcome (`onTransactionEnd` / `unmounted`) leads the user somewhere sensible.
- [ ] The project builds and type-checks.
- [ ] Tell the user to set the env vars and how to try it (camera access needs `localhost` or HTTPS).
