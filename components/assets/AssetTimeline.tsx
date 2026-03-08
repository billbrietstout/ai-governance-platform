"use client";

type Event = {
  id: string;
  action: string;
  at: Date;
  by?: string;
};

type Props = { events: Event[] };

export function AssetTimeline({ events }: Props) {
  if (events.length === 0) {
    return <p className="text-sm text-slatePro-500">No audit events yet.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((e, i) => (
        <div key={e.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-slatePro-500" />
            {i < events.length - 1 && <div className="mt-1 h-full w-px bg-slatePro-700" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="text-sm font-medium text-slatePro-200">{e.action}</div>
            <div className="text-xs text-slatePro-500">
              {new Date(e.at).toLocaleString()}
              {e.by && ` · ${e.by}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
