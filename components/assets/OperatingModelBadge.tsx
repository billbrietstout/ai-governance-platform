"use client";

type OperatingModel = "IN_HOUSE" | "VENDOR" | "HYBRID";

const STYLES: Record<OperatingModel, string> = {
  IN_HOUSE: "bg-emerald-500/20 text-emerald-400",
  VENDOR: "bg-navy-500/20 text-navy-300",
  HYBRID: "bg-amber-500/20 text-amber-400"
};

type Props = { model: OperatingModel | null };

export function OperatingModelBadge({ model }: Props) {
  if (!model) return <span className="text-slatePro-500">—</span>;
  const style = STYLES[model] ?? STYLES.IN_HOUSE;
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${style}`}>
      {model.replace("_", " ")}
    </span>
  );
}
