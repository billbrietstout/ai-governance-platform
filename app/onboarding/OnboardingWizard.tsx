"use client";

import { useState } from "react";
import { useActionState } from "react";
import { onboardingActions } from "./actions";

const VERTICALS = ["GENERAL", "HEALTHCARE", "FINANCIAL", "AUTOMOTIVE", "RETAIL", "MANUFACTURING", "PUBLIC_SECTOR"];
const PLANS = ["FREE", "TEAM", "ENTERPRISE"];
const ROLES = ["ADMIN", "CAIO", "ANALYST", "MEMBER", "VIEWER", "AUDITOR"];

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [vertical, setVertical] = useState("GENERAL");
  const [plan, setPlan] = useState("FREE");
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([{ email: "", role: "MEMBER" }]);

  const [state, formAction] = useActionState(
    async (prev: { error?: string } | null, formData: FormData) => {
      const action = formData.get("_action") as string;
      if (action === "step1") {
        return onboardingActions.step1(formData);
      }
      if (action === "step2") return null;
      if (action === "step3") return onboardingActions.step3(formData);
      if (action === "step4") return null;
      if (action === "step5") return onboardingActions.step5(formData);
      return null;
    },
    null as { error?: string } | null
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={`rounded px-3 py-1 text-sm ${step === s ? "bg-navy-600 text-white" : "bg-slatePro-800 text-slatePro-400"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {step === 1 && (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="_action" value="step1" />
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slatePro-300">Organization name</label>
            <input
              id="name"
              name="name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
            />
          </div>
          <div>
            <label htmlFor="vertical" className="block text-sm font-medium text-slatePro-300">Vertical</label>
            <select
              id="vertical"
              name="verticalMarket"
              value={vertical}
              onChange={(e) => setVertical(e.target.value)}
              className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
            >
              {VERTICALS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="plan" className="block text-sm font-medium text-slatePro-300">Plan</label>
            <select
              id="plan"
              name="plan"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="mt-1 w-full rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button type="submit" className="rounded bg-navy-600 px-4 py-2 text-sm text-white">Next</button>
        </form>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-slatePro-300">Regulatory profile suggested by vertical: {vertical}</p>
          <p className="text-sm text-slatePro-500">EU AI Act, NIST AI RMF, CoSAI SRF recommended.</p>
          <button type="button" onClick={() => setStep(3)} className="rounded bg-navy-600 px-4 py-2 text-sm text-white">
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="_action" value="step3" />
          <p className="text-slatePro-300">Activate compliance frameworks.</p>
          <button type="submit" className="rounded bg-navy-600 px-4 py-2 text-sm text-white">
            Activate frameworks
          </button>
        </form>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="text-slatePro-300">First integration – skip for now.</p>
          <button type="button" onClick={() => setStep(5)} className="rounded bg-navy-600 px-4 py-2 text-sm text-white">
            Skip
          </button>
        </div>
      )}

      {step === 5 && (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="_action" value="step5" />
          <p className="text-slatePro-300">Invite team members.</p>
          {invites.map((inv, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="email"
                name={`invite_${i}_email`}
                value={inv.email}
                onChange={(e) => {
                  const next = [...invites];
                  next[i] = { ...next[i], email: e.target.value };
                  setInvites(next);
                }}
                placeholder="email@example.com"
                className="flex-1 rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
              />
              <select
                name={`invite_${i}_role`}
                value={inv.role}
                onChange={(e) => {
                  const next = [...invites];
                  next[i] = { ...next[i], role: e.target.value };
                  setInvites(next);
                }}
                className="rounded border border-slatePro-600 bg-slatePro-900 px-3 py-2 text-slatePro-100"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setInvites([...invites, { email: "", role: "MEMBER" }])}
            className="text-sm text-navy-400 hover:underline"
          >
            + Add invite
          </button>
          {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
          <button type="submit" className="rounded bg-navy-600 px-4 py-2 text-sm text-white">
            Complete
          </button>
        </form>
      )}
    </div>
  );
}
