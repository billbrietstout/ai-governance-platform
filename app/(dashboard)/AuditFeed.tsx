"use client";

type Entry = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: Date;
};

type Props = { entries: Entry[] };

const ACTION_COLORS: Record<string, string> = {
  LOGIN: "bg-blue-500/20 text-blue-300",
  LOGOUT: "bg-slatePro-600/30 text-slatePro-400",
  CREATE: "bg-emerald-500/20 text-emerald-400",
  UPDATE: "bg-amber-500/20 text-amber-400",
  DELETE: "bg-red-500/20 text-red-400",
  ATTEST: "bg-purple-500/20 text-purple-400",
  APPROVE: "bg-emerald-500/20 text-emerald-400",
  REJECT: "bg-red-500/20 text-red-400"
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toUpperCase().includes(k));
  return key ? ACTION_COLORS[key] : "bg-slatePro-600/30 text-slatePro-400";
}

function getInitials(str: string): string {
  return str
    .split("_")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AuditFeed({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-slatePro-500">No recent activity</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => {
        const color = getActionColor(e.action);
        const initials = getInitials(e.action);
        return (
          <li key={e.id} className="flex items-center gap-3 text-sm">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${color}`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-medium text-slatePro-200">{e.action}</span>{" "}
              <span className="text-slatePro-500">{e.resourceType}</span>
            </div>
            <span className="shrink-0 text-xs text-slatePro-500">
              {new Date(e.createdAt).toLocaleString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
