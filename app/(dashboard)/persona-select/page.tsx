import { PersonaSelectGrid } from "./PersonaSelectGrid";

export default function PersonaSelectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Switch view</h1>
        <p className="mt-1 text-slate-600">
          Choose a view tailored to your role. You can change this anytime from the sidebar.
        </p>
      </div>

      <PersonaSelectGrid />
    </div>
  );
}
