import { toggleCompare } from "@/app/actions/compare";

export function CompareToggle({
  propertyId,
  isSelected,
  className = "",
  size = "md",
}: {
  propertyId: string;
  isSelected: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  const pad = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const base = isSelected
    ? "bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800"
    : "bg-white/95 text-gray-800 border-gray-300 hover:bg-white";

  return (
    <form action={toggleCompare.bind(null, propertyId)} className={className}>
      <button
        type="submit"
        className={`${pad} rounded border ${base} font-medium shadow-sm`}
        aria-pressed={isSelected}
      >
        {isSelected ? "✓ In compare" : "+ Compare"}
      </button>
    </form>
  );
}
