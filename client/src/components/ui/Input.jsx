import { useId } from "react";

export default function Input({
  label,
  name,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  className = "",
  labelClassName = "",
  ...props
}) {
  const generatedId = useId();
  const inputId = id || name || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy =
    [
      error ? errorId : null,
      helperText ? helperId : null,
      props["aria-describedby"],
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const inputClasses = [
    "block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900",
    "placeholder:text-gray-400",
    "transition-colors duration-200",
    "focus:outline-none focus:ring-2 focus:ring-offset-0",
    "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500",
    error
      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
      : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-200",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={[
            "mb-1.5 block text-sm font-medium text-gray-700",
            labelClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {label}

          {required && (
            <span className="ml-1 text-red-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputClasses}
        {...props}
      />

      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={helperId} className="mt-1.5 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
