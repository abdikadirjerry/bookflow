const statusStyles = {
  pending: "bg-amber-100 text-amber-800 ring-amber-600/20",
  confirmed: "bg-blue-100 text-blue-800 ring-blue-600/20",
  completed: "bg-green-100 text-green-800 ring-green-600/20",
  cancelled: "bg-red-100 text-red-800 ring-red-600/20",
  active: "bg-green-100 text-green-800 ring-green-600/20",
  inactive: "bg-gray-100 text-gray-700 ring-gray-600/20",
};

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  active: "Active",
  inactive: "Inactive",
};

export default function StatusBadge({ status, className = "" }) {
  const normalizedStatus =
    typeof status === "string" ? status.trim().toLowerCase() : "";

  const styles =
    statusStyles[normalizedStatus] ||
    "bg-gray-100 text-gray-700 ring-gray-600/20";

  const label =
    statusLabels[normalizedStatus] ||
    (normalizedStatus ? normalizedStatus.replace(/[_-]+/g, " ") : "Unknown");

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1",
        "text-xs font-semibold capitalize ring-1 ring-inset",
        styles,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </span>
  );
}
