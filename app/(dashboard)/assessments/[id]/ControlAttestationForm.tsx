"use client";

import { useActionState } from "react";
import { upsertAttestation } from "./actions";

type Props = {
  assetId: string;
  controlId: string;
  controlTitle: string;
  currentStatus: string;
  currentNotes: string;
};

export function ControlAttestationForm({
  assetId,
  controlId,
  controlTitle,
  currentStatus,
  currentNotes
}: Props) {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await upsertAttestation(formData);
      return result ?? null;
    },
    null as { error?: string } | null
  );

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="assetId" value={assetId} />
      <input type="hidden" name="controlId" value={controlId} />
      <div className="flex flex-col gap-2">
        <select
          name="status"
          defaultValue={currentStatus}
          className="border-slatePro-600 bg-slatePro-900 text-slatePro-100 rounded border px-2 py-1 text-sm"
        >
          <option value="PENDING">Pending</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="NON_COMPLIANT">Non-compliant</option>
          <option value="NOT_APPLICABLE">Not applicable</option>
        </select>
        <input
          name="notes"
          type="text"
          placeholder="Notes"
          defaultValue={currentNotes}
          className="border-slatePro-600 bg-slatePro-900 text-slatePro-100 w-40 rounded border px-2 py-1 text-sm"
        />
        <button
          type="submit"
          className="bg-navy-600 hover:bg-navy-500 rounded px-2 py-1 text-xs text-white"
        >
          Save
        </button>
      </div>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
