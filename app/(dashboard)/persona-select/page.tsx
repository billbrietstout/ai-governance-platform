import { PersonaSelectGrid } from "./PersonaSelectGrid";

export default function PersonaSelectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Choose your view</h1>
        <p className="mt-1 text-slate-600">
          Select a view tailored to your role. You&apos;ll see a focused dashboard with just what
          matters for your role.
        </p>
        <p className="mt-2 rounded-lg border border-navy-200 bg-navy-50 p-3 text-sm text-navy-800">
          You can always access the full platform from any page via &quot;Switch to full platform
          →&quot; in the top right.
        </p>
      </div>

      <PersonaSelectGrid />
    </div>
  );
}
