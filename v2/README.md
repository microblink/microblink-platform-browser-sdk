# Microblink Platform SDK v2 examples

Example apps for [`@microblink/platform-sdk`](https://www.npmjs.com/package/@microblink/platform-sdk) v2.

| Folder                     | What it shows                                                          | Port |
| -------------------------- | ---------------------------------------------------------------------- | ---- |
| [`server`](server)         | The backend: creates a transaction and returns a session token          | 3001 |
| [`vanilla`](vanilla)       | Plain JavaScript, the SDK renders every screen                          | 5173 |
| [`react`](react)           | React, the SDK renders every screen                                     | 5174 |
| [`custom-ui`](custom-ui)   | React with your own screens, the SDK only renders the camera steps      | 5175 |
| [`skill`](skill)           | A Claude skill that integrates the SDK into your own app for you        | –    |

## How it works

```
 Browser                        Your backend                    Microblink Platform
 ───────                        ────────────                    ───────────────────
 POST /api/session  ─────────►  POST /transaction  ───────────►
                                (API credentials)
 { sessionToken }   ◄─────────  sdkConfiguration   ◄───────────

 createPlatformSdk({ sessionToken })  ◄──── the SDK runs your workflow ────►
```

1. Your backend creates a transaction with your API credentials. The credentials never leave the backend.
2. The browser gets back a session token and passes it to the SDK.
3. The SDK runs every step of your workflow and tells you the result: `Accept`, `Reject` or `Review`.

## Run the examples

You need Node.js 20.6+ and a [Microblink Platform account](https://platform.docs.microblink.com/account-setup/) with API credentials and a workflow ID.

**1. Start the server**

```sh
cd v2/server
cp .env.example .env   # fill in your credentials and workflow ID
npm install
npm start
```

**2. Start an app** (in a second terminal)

```sh
cd v2/react            # or v2/vanilla, v2/custom-ui
npm install
npm run dev
```

Open the URL Vite prints. The apps call `/api/session`, which Vite forwards to the server on port 3001.

The first start copies the camera resources (WASM files, ~130 MB) into `public/resources`. Camera access needs `localhost` or HTTPS, so to test on a phone, use a tunnel (e.g. `cloudflared tunnel --url http://localhost:5174`).

## Code snippets from examples

### Server: [`server/server.js`](server/server.js)

One endpoint. It calls the Agent API's `POST /transaction` and returns `sdkConfiguration` as `sessionToken`:

```js
app.post("/api/session", async (req, res) => {
  const response = await fetch(`${AGENT_API_URL}/transaction`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${credentials}` },
    body: JSON.stringify({ workflowId: WORKFLOW_ID, platform: "Browser", consent: { ... } }),
  });
  const { sdkConfiguration } = await response.json();
  res.json({ sessionToken: sdkConfiguration });
});
```

Use any backend you like. This is the only call you need.

### Vanilla: [`vanilla/main.js`](vanilla/main.js)

```js
import { createPlatformSdk } from "@microblink/platform-sdk";

const { sessionToken } = await fetch("/api/session", { method: "POST" }).then((r) => r.json());
const sdk = createPlatformSdk({ sessionToken, target: container });

sdk.onTransactionEnd(({ verificationStatus }) => { /* Accept | Reject | Review */ });
```

### React: [`react/src/App.tsx`](react/src/App.tsx)

```tsx
import { PlatformFlowUI, usePlatformSdk } from "@microblink/platform-sdk/react";

const sdk = usePlatformSdk({ sessionToken });
return <PlatformFlowUI config={sdk} />;
```

### Custom UI: [`custom-ui/src/Verification.tsx`](custom-ui/src/Verification.tsx)

Render your own screen for any step and leave the rest to the SDK. Checking `currentStep` narrows `sdk.state` and the actions, so TypeScript tells you exactly what each step gives you:

```tsx
const sdk = usePlatformSdk({ sessionToken, theme: { accent: "#4f46e5" } });

if (sdk.currentStep === "PROGRESS_OVERVIEW") return <Overview onContinue={() => sdk.next()} onCancel={sdk.abort} />;
if (sdk.currentStep === "MANUAL_INPUT") return <Form fields={sdk.state.formFields} onSubmit={sdk.next} />;
if (sdk.currentStep === "ERROR") return <ErrorScreen code={sdk.state.error.error.code} onRetry={sdk.retry} />;
if (sdk.currentStep === "END") return <Result status={sdk.state.verificationStatus} onFinish={sdk.finish} />;

// Document scan, face capture and everything else: the SDK's own UI, in your brand colour.
return <PlatformFlowUI config={sdk} />;
```

The screens in [`custom-ui/src/screens.tsx`](custom-ui/src/screens.tsx) are plain React components. Swap them for your own design system.

Camera steps (document scan, card scan, face capture) always use the SDK's UI. `theme` makes them match your brand.

Vanilla apps do the same with `sdk.onStep("END", (state, actions) => { ... })`.

## Let Claude integrate it for you

[`skill/microblink-platform-sdk/SKILL.md`](skill/microblink-platform-sdk/SKILL.md) teaches [Claude Code](https://claude.com/claude-code) how to integrate the SDK: backend endpoint, camera resources, frontend and optional custom UI, in whatever stack your project uses.

Copy it into your project and ask Claude to add identity verification:

```sh
mkdir -p .claude/skills
cp -r path/to/v2/skill/microblink-platform-sdk .claude/skills/
```

Using another AI assistant? Paste the contents of `SKILL.md` into the chat as a prompt.

## Learn more

- SDK reference: the [package README](https://www.npmjs.com/package/@microblink/platform-sdk) covers every option, step, event, theming, translations and device-to-device.
- [Platform documentation](https://platform.docs.microblink.com/)
