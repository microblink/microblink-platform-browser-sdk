import { PlatformFlowUI, usePlatformSdk } from "@microblink/platform-sdk/react";
import { useEffect, useState } from "react";

// 1. Ask your backend for a session token (see v2/server/server.js).
async function createSession(): Promise<string> {
  const response = await fetch("/api/session", { method: "POST" });

  if (!response.ok) throw new Error("Could not start a verification. Is the example server running?");

  const { sessionToken } = await response.json();
  return sessionToken;
}

export function App() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function start() {
    setMessage("");
    try {
      setSessionToken(await createSession());
    } catch (error) {
      setMessage(String(error));
    }
  }

  return (
    <main>
      <h1>Verify your identity</h1>
      {sessionToken ? (
        <Verification
          sessionToken={sessionToken}
          onDone={(result) => {
            setMessage(result);
            setSessionToken(null);
          }}
        />
      ) : (
        <button onClick={start}>Start verification</button>
      )}
      <p>{message}</p>
    </main>
  );
}

function Verification({ sessionToken, onDone }: { sessionToken: string; onDone: (result: string) => void }) {
  // 2. Start the SDK. One hook call per verification.
  const sdk = usePlatformSdk({ sessionToken });

  // 3. React to the outcome. `unmounted` flips once the SDK removes its UI.
  useEffect(() => {
    if (!sdk.unmounted) return;

    onDone(
      sdk.currentStep === "END" ? `Verification finished: ${sdk.state.verificationStatus}` : "Verification cancelled",
    );
  }, [sdk.unmounted]);

  // 4. The SDK renders every step of your workflow.
  return (
    <div className="verification">
      <PlatformFlowUI config={sdk} />
    </div>
  );
}
