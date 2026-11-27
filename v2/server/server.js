// Example backend for the Microblink Platform SDK v2.
//
// It has one job: create a transaction with your API credentials and hand the
// browser the session token. Credentials never leave this server.
//
// Every example app calls `POST /api/session` and passes the returned
// `sessionToken` to the SDK.

import express from "express";

const { AGENT_API_URL, CLIENT_ID, CLIENT_SECRET, WORKFLOW_ID, PORT = 3001 } = process.env;

const app = express();
app.use(express.json());

app.post("/api/session", async (req, res) => {
  const response = await fetch(`${AGENT_API_URL}/transaction`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: JSON.stringify({
      workflowId: WORKFLOW_ID,
      platform: "Browser",
      // Consent is collected by you and recorded here, so the SDK doesn't ask for it.
      consent: {
        userId: req.body?.userId ?? "example-user",
        isProcessingStoringAllowed: true,
        givenOn: new Date(),
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`createTransaction failed (${response.status}): ${error}`);
    return res.status(502).json({ error: `createTransaction failed (${response.status})` });
  }

  const { sdkConfiguration } = await response.json();

  res.json({ sessionToken: sdkConfiguration });
});

app.listen(PORT, () => console.log(`Example server listening on http://localhost:${PORT}`));
