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
    return <p className="text-slatePro-500 text-sm">No audit events yet.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((e, i) => (
        <div key={e.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="bg-slatePro-500 h-2 w-2 rounded-full" />
            {i < events.length - 1 && <div className="bg-slatePro-700 mt-1 h-full w-px" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="text-slatePro-200 text-sm font-medium">{e.action}</div>
            <div className="text-slatePro-500 text-xs">
              {new Date(e.at).toLocaleString()}
              {e.by && ` · ${e.by}`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
