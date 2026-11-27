// Plain React components. Nothing here imports the SDK's UI: they get data and
// callbacks from Verification.tsx, so you can build them with any design system.

import type { SessionState, StepActions } from "@microblink/platform-sdk";
import type { FormEvent } from "react";

type FormField = NonNullable<SessionState["formFields"]>[number];

// Workflow steps come with a `type`; `name` is only set when you name the step on the platform.
const STEP_LABELS: Record<string, string> = {
  BlinkId: "Scan your ID",
  DocVer: "Scan your ID",
  BlinkCard: "Scan your card",
  FaceMatch: "Take a selfie",
  Form: "Fill in a few details",
  UploadIdDocument: "Upload your ID",
  UploadNonIdDocument: "Upload a document",
};

export function Overview(props: {
  progress: SessionState["workflowProgress"];
  onContinue: () => void;
  onContinueOnPhone?: () => void;
  onCancel: () => void;
}) {
  const completed = props.progress.completedStepIds ?? [];

  return (
    <section className="screen">
      <h2>Let's verify your identity</h2>
      <ol className="steps">
        {props.progress.steps?.map((step) => (
          <li key={step.id} className={completed.includes(step.id!) ? "done" : ""}>
            {step.name ?? STEP_LABELS[step.type ?? ""] ?? step.type}
          </li>
        ))}
      </ol>
      <button onClick={props.onContinue}>Continue</button>
      {props.onContinueOnPhone && (
        <button className="secondary" onClick={props.onContinueOnPhone}>
          Continue on my phone
        </button>
      )}
      <button className="link" onClick={props.onCancel}>
        Cancel
      </button>
    </section>
  );
}

const INPUT_TYPES: Record<string, string> = {
  Integer: "number",
  Decimal: "number",
  Date: "date",
  DateTime: "datetime-local",
  Time: "time",
  Boolean: "checkbox",
  Blob: "file",
};

async function readFile(file: File) {
  return { fileName: file.name, contentType: file.type, rawImage: new Uint8Array(await file.arrayBuffer()) };
}

export function Form(props: { fields: FormField[]; onSubmit: StepActions<"MANUAL_INPUT">["next"]; onBack: () => void }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const formValues: Record<string, string | null> = {};
    const files: Record<string, Awaited<ReturnType<typeof readFile>>> = {};

    for (const { name, type } of props.fields) {
      if (!name) continue;
      const value = data.get(name);

      if (type === "Boolean") formValues[name] = value ? "true" : "false";
      else if (value instanceof File) {
        if (value.size > 0) files[name] = await readFile(value);
      } else formValues[name] = value || null;
    }

    props.onSubmit({ formValues, files });
  }

  return (
    <form className="screen" onSubmit={handleSubmit}>
      <h2>A few details</h2>
      {props.fields.map((field) => (
        <label key={field.name} className={field.type === "Boolean" ? "checkbox" : ""}>
          {field.displayName ?? field.name}
          <input
            name={field.name ?? undefined}
            type={INPUT_TYPES[field.type ?? ""] ?? "text"}
            required={field.isRequired && field.type !== "Boolean"}
            defaultValue={field.type === "Boolean" ? undefined : (field.defaultValue ?? undefined)}
            defaultChecked={field.type === "Boolean" ? field.defaultValue === "true" : undefined}
            step={field.type === "Decimal" ? "any" : undefined}
            accept={field.type === "Blob" ? (field.typeMetadata ?? undefined) : undefined}
          />
        </label>
      ))}
      <button type="submit">Submit</button>
      <button type="button" className="link" onClick={props.onBack}>
        Back
      </button>
    </form>
  );
}

export function ErrorScreen(props: { code: string; onRetry?: () => void; onClose: () => void }) {
  return (
    <section className="screen">
      <h2>Something went wrong</h2>
      <p className="muted">Error code: {props.code}</p>
      {props.onRetry && <button onClick={props.onRetry}>Try again</button>}
      <button className="link" onClick={props.onClose}>
        Close
      </button>
    </section>
  );
}

const RESULT_TEXT = {
  Accept: "You're verified ✅",
  Reject: "We couldn't verify you ❌",
  Review: "Thanks! We're reviewing your details ⏳",
};

export function Result(props: { status?: keyof typeof RESULT_TEXT; onFinish: () => void }) {
  return (
    <section className="screen">
      <h2>{props.status ? RESULT_TEXT[props.status] : "Done"}</h2>
      <button onClick={props.onFinish}>Finish</button>
    </section>
  );
}
