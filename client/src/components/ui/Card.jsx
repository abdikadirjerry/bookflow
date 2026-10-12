const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  className = "",
  padding = "md",
  ...props
}) {
  const cardClasses = [
    "rounded-xl border border-gray-200 bg-white shadow-sm",
    paddings[padding] ?? paddings.md,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
}
