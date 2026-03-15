"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ORG_SIZES } from "@/lib/onboarding/steps";
import { saveStep1 } from "./actions";

type Props = {
  completedData: {
    name: string;
    orgSize: string | null;
    primaryUseCase: string | null;
  };
  onNext: () => void;
  isPending: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Next"}
    </button>
  );
}

export function Step1Profile({ completedData, onNext, isPending }: Props) {
  const [name, setName] = useState(completedData.name || "");
  const [orgSize, setOrgSize] = useState(completedData.orgSize || "");
  const [primaryUseCase, setPrimaryUseCase] = useState(
    completedData.primaryUseCase || ""
  );

  return (
    <form
      action={async (formData) => {
        await saveStep1({
          name: formData.get("name") as string,
          orgSize: formData.get("orgSize") as "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE",
          primaryUseCase: formData.get("primaryUseCase") as string
        });
        onNext();
      }}
      className="space-y-6"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Organization name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          placeholder="Acme Inc"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Organization size
        </label>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ORG_SIZES.map((s) => (
            <label
              key={s.value}
              className={`flex cursor-pointer flex-col rounded-lg border p-3 transition ${
                orgSize === s.value
                  ? "border-navy-500 bg-navy-50 ring-1 ring-navy-500"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="orgSize"
                value={s.value}
                checked={orgSize === s.value}
                onChange={() => setOrgSize(s.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-slate-900">{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="primaryUseCase"
          className="block text-sm font-medium text-slate-700"
        >
          Primary AI use case
        </label>
        <input
          id="primaryUseCase"
          name="primaryUseCase"
          type="text"
          value={primaryUseCase}
          onChange={(e) => setPrimaryUseCase(e.target.value)}
          required
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          placeholder="e.g. Customer service chatbot, Fraud detection"
        />
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
