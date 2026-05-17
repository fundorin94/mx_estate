"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitLead, type LeadFormState } from "./actions";

const initial: LeadFormState = { status: "idle" };

export function LeadForm({
  propertyId,
  realtorId,
}: {
  propertyId: string;
  realtorId: string | null;
}) {
  const [state, formAction] = useFormState(submitLead, initial);
  const [open, setOpen] = useState(false);

  if (state.status === "success") {
    return (
      <div className="mt-2 rounded border border-green-300 bg-green-50 p-3 text-sm text-green-900">
        ✅ Thanks! Your request has been sent. The agent will reach out within
        24 hours.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800"
      >
        Request more info
      </button>
    );
  }

  const errs = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-3">
      <input type="hidden" name="property_id" value={propertyId} />
      <input type="hidden" name="realtor_id" value={realtorId ?? ""} />

      <Field label="Your name" name="name" required error={errs.name} />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        error={errs.email}
      />
      <Field label="Phone (optional)" name="phone" />

      <label className="flex flex-col text-sm">
        <span className="text-gray-700 mb-1">Message</span>
        <textarea
          name="message"
          required
          rows={3}
          defaultValue="I'm interested in this property and would like more details."
          className={`border rounded px-2 py-1 ${
            errs.message ? "border-red-400" : "border-gray-300"
          }`}
        />
        {errs.message && (
          <span className="text-xs text-red-600 mt-1">{errs.message}</span>
        )}
      </label>

      <Field
        label="Budget USD (optional)"
        name="budget_usd"
        type="number"
        min={0}
        step={1000}
        error={errs.budget_usd}
      />

      <label className="flex flex-col text-sm">
        <span className="text-gray-700 mb-1">Timeline</span>
        <select
          name="timeline"
          defaultValue=""
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="">Not sure yet</option>
          <option value="asap">ASAP</option>
          <option value="3mo">Within 3 months</option>
          <option value="6mo">Within 6 months</option>
          <option value="1yr">Within a year</option>
        </select>
      </label>

      {state.status === "error" && !state.fieldErrors && (
        <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-800">
          {state.message}
        </div>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-gray-600 hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col text-sm">
      <span className="text-gray-700 mb-1">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className={`border rounded px-2 py-1 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
        {...rest}
      />
      {error && <span className="text-xs text-red-600 mt-1">{error}</span>}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-black text-white rounded px-4 py-2 text-sm hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? "Sending…" : "Send request"}
    </button>
  );
}
