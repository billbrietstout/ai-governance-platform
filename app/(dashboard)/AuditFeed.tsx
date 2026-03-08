"use client";

type Entry = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  createdAt: Date;
};

type Props = { entries: Entry[] };

export function AuditFeed({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-slatePro-500">No recent activity</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((e) => (
        <li key={e.id} className="flex justify-between text-sm">
          <span className="text-slatePro-300">
            <span className="font-medium">{e.action}</span> {e.resourceType}
          </span>
          <span className="text-slatePro-500">{new Date(e.createdAt).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}
