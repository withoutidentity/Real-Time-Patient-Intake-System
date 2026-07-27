import { clsx } from "clsx";
import type { FieldStatus } from "@/lib/schema";

const labels: Record<FieldStatus, string> = {
  inactive: "Inactive",
  filling: "Filling",
  submitted: "Submitted"
};

export function StatusBadge({ status }: { status: FieldStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-semibold",
        status === "inactive" && "bg-zinc-100 text-zinc-700",
        status === "filling" && "bg-blue-100 text-blue-800",
        status === "submitted" && "bg-emerald-100 text-emerald-800"
      )}
    >
      <span
        className={clsx(
          "h-2 w-2 rounded-full",
          status === "inactive" && "bg-zinc-400",
          status === "filling" && "bg-blue-600",
          status === "submitted" && "bg-emerald-600"
        )}
        aria-hidden="true"
      />
      {labels[status]}
    </span>
  );
}
