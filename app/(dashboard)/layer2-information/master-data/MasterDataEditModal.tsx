"use client";

import { useState } from "react";
import { updateMasterDataEntity } from "./actions";

type Entity = {
  id: string;
  stewardId?: string | null;
  classification: string;
  aiAccessPolicy: string;
};

type User = { id: string; email: string };

type Props = {
  entity: Entity;
  users?: User[];
  onClose: () => void;
  onSaved: () => void;
};

export function MasterDataEditModal({ entity, users = [], onClose, onSaved }: Props) {
  const [stewardId, setStewardId] = useState(entity.stewardId ?? "");
  const [classification, setClassification] = useState(entity.classification);
  const [aiAccessPolicy, setAiAccessPolicy] = useState(entity.aiAccessPolicy);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMasterDataEntity({
        id: entity.id,
        stewardId: stewardId || null,
        classification: classification as "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED",
        aiAccessPolicy: aiAccessPolicy as "OPEN" | "GOVERNED" | "RESTRICTED" | "PROHIBITED"
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">Edit Entity</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Steward</label>
            <select
              value={stewardId}
              onChange={(e) => setStewardId(e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">— No steward —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Classification</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="RESTRICTED">RESTRICTED</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">AI Access Policy</label>
            <select
              value={aiAccessPolicy}
              onChange={(e) => setAiAccessPolicy(e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="OPEN">OPEN</option>
              <option value="GOVERNED">GOVERNED</option>
              <option value="RESTRICTED">RESTRICTED</option>
              <option value="PROHIBITED">PROHIBITED</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-navy-600 px-4 py-2 text-sm font-medium text-white hover:bg-navy-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
