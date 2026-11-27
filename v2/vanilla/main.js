import { createPlatformSdk } from "@microblink/platform-sdk";

const startButton = document.querySelector("#start");
const message = document.querySelector("#message");
const container = document.querySelector("#verification");

startButton.addEventListener("click", async () => {
  startButton.hidden = true;
  message.textContent = "";

  // 1. Ask your backend for a session token (see v2/server/server.js).
  const response = await fetch("/api/session", { method: "POST" });

  if (!response.ok) {
    message.textContent = "Could not start a verification. Is the example server running?";
    startButton.hidden = false;
    return;
  }

  const { sessionToken } = await response.json();

  // 2. Start the SDK. It renders every step of your workflow into `target`.
  const sdk = createPlatformSdk({ sessionToken, target: container });

  // 3. React to the outcome.
  sdk.onTransactionEnd(({ verificationStatus, transactionId }) => {
    message.textContent = `Verification finished: ${verificationStatus} (transaction ${transactionId})`;
  });

  sdk.onAbort(({ step }) => {
    message.textContent = `Verification cancelled on step ${step}`;
  });

  // The SDK removed its UI (finished, cancelled or destroyed): let the user start again.
  sdk.onUnmount(() => {
    startButton.hidden = false;
  });
});
