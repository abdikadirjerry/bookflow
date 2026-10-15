export default function PageHeader({
  title,
  description,
  eyebrow,
  children,
  action,
  className = "",
}) {
  const headerActions = action ?? children;

  return (
    <div
      className={[
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            {eyebrow}
          </p>
        )}

        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            {description}
          </p>
        )}
      </div>

      {headerActions && (
        <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
          {headerActions}
        </div>
      )}
    </div>
  );
}
