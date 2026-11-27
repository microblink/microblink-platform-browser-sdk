import { useState } from "react";

import { Verification } from "./Verification";

// Ask your backend for a session token (see v2/server/server.js).
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
      <div className="card">
        {sessionToken ? (
          <Verification
            sessionToken={sessionToken}
            onDone={(result) => {
              setMessage(result);
              setSessionToken(null);
            }}
          />
        ) : (
          <section className="screen">
            <h2>Acme Bank</h2>
            <p className="muted">Open an account in minutes. We just need to verify it's you.</p>
            <button onClick={start}>Get started</button>
            <p>{message}</p>
          </section>
        )}
      </div>
    </main>
  );
}
