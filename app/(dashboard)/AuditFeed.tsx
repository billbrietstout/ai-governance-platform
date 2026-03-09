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
  LOGIN: "bg-blue-100 text-blue-700",
  LOGOUT: "bg-gray-100 text-gray-600",
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
  ATTEST: "bg-purple-100 text-purple-700",
  APPROVE: "bg-emerald-100 text-emerald-700",
  REJECT: "bg-red-100 text-red-700"
};

function getActionColor(action: string): string {
  const key = Object.keys(ACTION_COLORS).find((k) => action.toUpperCase().includes(k));
  return key ? ACTION_COLORS[key] : "bg-gray-100 text-gray-600";
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
    return <p className="text-sm text-gray-500">No recent activity</p>;
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
              <span className="font-medium text-gray-900">{e.action}</span>{" "}
              <span className="text-gray-500">{e.resourceType}</span>
            </div>
            <span className="shrink-0 text-xs text-gray-500">
              {new Date(e.createdAt).toLocaleString()}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
