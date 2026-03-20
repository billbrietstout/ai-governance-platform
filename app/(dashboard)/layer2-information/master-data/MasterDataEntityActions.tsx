"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { createServerCaller } from "@/lib/trpc/server-caller";
import { MasterDataEditModal } from "./MasterDataEditModal";

type Entity = {
  id: string;
  name: string;
  classification: string;
  aiAccessPolicy: string;
  stewardId?: string | null;
};

type User = { id: string; email: string };

export function MasterDataEntityActions({
  entity,
  users = []
}: {
  entity: Entity;
  users?: User[];
}) {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowEdit(true)}
        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      {showEdit && (
        <MasterDataEditModal
          entity={entity}
          users={users}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
