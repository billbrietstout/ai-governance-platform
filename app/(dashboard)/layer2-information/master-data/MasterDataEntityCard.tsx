"use client";

import Link from "next/link";
import { GitBranch, Users, Package, Building2, DollarSign, MapPin, MoreHorizontal } from "lucide-react";
import { MasterDataEntityActions } from "./MasterDataEntityActions";

const ENTITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CUSTOMER: Users,
  PRODUCT: Package,
  VENDOR: Building2,
  EMPLOYEE: Users,
  FINANCE: DollarSign,
  LOCATION: MapPin,
  OTHER: MoreHorizontal
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  PUBLIC: "bg-emerald-100 text-emerald-700",
  INTERNAL: "bg-blue-100 text-blue-700",
  CONFIDENTIAL: "bg-amber-100 text-amber-700",
  RESTRICTED: "bg-red-100 text-red-700"
};

const AI_ACCESS_COLORS: Record<string, string> = {
  OPEN: "bg-emerald-100 text-emerald-700",
  GOVERNED: "bg-blue-100 text-blue-700",
  RESTRICTED: "bg-amber-100 text-amber-700",
  PROHIBITED: "bg-red-100 text-red-700"
};

function QualityCircle({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="text-xs text-slate-500">—</span>;
  const color =
    score > 80 ? "text-emerald-500" : score >= 60 ? "text-amber-500" : "text-red-500";
  return (
    <div className="flex items-center gap-1">
      <div
        className={`h-6 w-6 rounded-full border-2 ${
          score > 80 ? "border-emerald-500" : score >= 60 ? "border-amber-500" : "border-red-500"
        } flex items-center justify-center text-xs font-medium ${color}`}
      >
        {Math.round(score)}
      </div>
      <span className="text-xs text-slate-500">quality</span>
    </div>
  );
}

type Entity = {
  id: string;
  name: string;
  entityType: string;
  description?: string | null;
  classification: string;
  aiAccessPolicy: string;
  qualityScore?: number | null;
  recordCount?: number | null;
  stewardId?: string | null;
  steward?: { email: string } | null;
};

type User = { id: string; email: string };

export function MasterDataEntityCard({ entity, users = [] }: { entity: Entity; users?: User[] }) {
  const Icon = ENTITY_ICONS[entity.entityType] ?? MoreHorizontal;
  const stewardName = entity.steward?.email?.split("@")[0] ?? "—";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-100">
            <Icon className="h-5 w-5 text-navy-600" />
          </div>
          <div>
            <h3 className="font-medium text-slate-900">{entity.name}</h3>
            <p className="text-xs text-slate-500">{entity.entityType}</p>
          </div>
        </div>
        <MasterDataEntityActions entity={entity} users={users} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${CLASSIFICATION_COLORS[entity.classification] ?? "bg-gray-100 text-gray-700"}`}
        >
          {entity.classification}
        </span>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${AI_ACCESS_COLORS[entity.aiAccessPolicy] ?? "bg-gray-100 text-gray-700"}`}
        >
          {entity.aiAccessPolicy}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-600">
          Steward: <span className="font-medium">{stewardName}</span>
        </span>
        <QualityCircle score={entity.qualityScore} />
      </div>

      {entity.recordCount != null && (
        <p className="mt-2 text-xs text-slate-500">{entity.recordCount.toLocaleString()} records</p>
      )}

      <Link
        href={`/layer2-information/lineage?source=${entity.id}`}
        className="mt-3 flex items-center gap-1 text-sm text-navy-600 hover:underline"
      >
        <GitBranch className="h-4 w-4" />
        View Lineage
      </Link>
    </div>
  );
}
