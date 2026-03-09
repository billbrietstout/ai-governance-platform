"use client";

type OperatingModel = "IN_HOUSE" | "VENDOR" | "HYBRID";

const STYLES: Record<OperatingModel, string> = {
  IN_HOUSE: "bg-emerald-100 text-emerald-700",
  VENDOR: "bg-navy-100 text-navy-700",
  HYBRID: "bg-amber-100 text-amber-700"
};

type Props = { model: OperatingModel | null };

export function OperatingModelBadge({ model }: Props) {
  if (!model) return <span className="text-gray-500">—</span>;
  const style = STYLES[model] ?? STYLES.IN_HOUSE;
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${style}`}>
      {model.replace("_", " ")}
    </span>
  );
}
