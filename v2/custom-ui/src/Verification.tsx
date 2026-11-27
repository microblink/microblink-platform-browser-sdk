import { PlatformFlowUI, usePlatformSdk } from "@microblink/platform-sdk/react";
import { useEffect } from "react";

import { ErrorScreen, Form, Overview, Result } from "./screens";

export function Verification({ sessionToken, onDone }: { sessionToken: string; onDone: (result: string) => void }) {
  const sdk = usePlatformSdk({
    sessionToken,
    // The camera screens are always the SDK's own, but they follow your brand.
    theme: { accent: "#4f46e5", fontFamily: "system-ui, sans-serif", buttonBorderRadius: 8 },
  });

  useEffect(() => {
    if (!sdk.unmounted) return;

    onDone(sdk.currentStep === "END" ? `Verification finished: ${sdk.state.verificationStatus}` : "Verification cancelled");
  }, [sdk.unmounted]);

  // Your own screens. Checking `currentStep` narrows `sdk.state` and the actions to that step.

  if (sdk.currentStep === "PROGRESS_OVERVIEW") {
    return (
      <Overview
        progress={sdk.state.workflowProgress}
        onContinue={() => sdk.next()}
        onContinueOnPhone={sdk.switchToD2D}
        onCancel={sdk.abort}
      />
    );
  }

  if (sdk.currentStep === "MANUAL_INPUT") {
    return <Form fields={sdk.state.formFields} onSubmit={sdk.next} onBack={sdk.close} />;
  }

  if (sdk.currentStep === "ERROR") {
    return <ErrorScreen code={sdk.state.error.error.code} onRetry={sdk.retry} onClose={sdk.close} />;
  }

  if (sdk.currentStep === "END") {
    return <Result status={sdk.state.verificationStatus} onFinish={sdk.finish} />;
  }

  // Everything else (document scan, face capture, loading, ...) is the SDK's UI.
  return <PlatformFlowUI config={sdk} />;
}
