import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAvailability,
  updateAvailability,
} from "../services/availabilityService";

const days = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const defaultSchedule = {
  enabled: false,
  startTime: "09:00",
  endTime: "17:00",
};

const createDefaultAvailability = () =>
  Object.fromEntries(days.map(({ key }) => [key, { ...defaultSchedule }]));

const normalizeAvailability = (value = {}) =>
  Object.fromEntries(
    days.map(({ key }) => [
      key,
      {
        ...defaultSchedule,
        ...(value[key] || {}),
        enabled: Boolean(value[key]?.enabled),
      },
    ]),
  );

const schedulesEqual = (first, second) =>
  JSON.stringify(normalizeAvailability(first)) ===
  JSON.stringify(normalizeAvailability(second));

function OwnerAvailability() {
  const [availability, setAvailability] = useState(createDefaultAvailability);
  const [savedAvailability, setSavedAvailability] = useState(
    createDefaultAvailability,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasChanges = useMemo(
    () => !schedulesEqual(availability, savedAvailability),
    [availability, savedAvailability],
  );

  const enabledDays = useMemo(
    () => days.filter(({ key }) => availability[key]?.enabled).length,
    [availability],
  );

  const fetchAvailability = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const data = await getAvailability();
      const normalized = normalizeAvailability(data?.availability);

      setAvailability(normalized);
      setSavedAvailability(normalized);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load your availability. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    if (!hasChanges || isLoading || isSaving) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges, isLoading, isSaving]);

  const handleDayChange = (day, field, value) => {
    setAvailability((current) => ({
      ...current,
      [day]: {
        ...(current[day] || defaultSchedule),
        [field]: value,
      },
    }));

    setSuccess("");
    setError("");
  };

  const copyScheduleToWeekdays = () => {
    const mondaySchedule = availability.monday;

    setAvailability((current) => ({
      ...current,
      tuesday: { ...mondaySchedule },
      wednesday: { ...mondaySchedule },
      thursday: { ...mondaySchedule },
      friday: { ...mondaySchedule },
    }));

    setSuccess("");
    setError("");
  };

  const copyPreviousDay = (dayIndex) => {
    if (dayIndex === 0) return;

    const previousDay = days[dayIndex - 1].key;
    const currentDay = days[dayIndex].key;

    setAvailability((current) => ({
      ...current,
      [currentDay]: { ...current[previousDay] },
    }));

    setSuccess("");
    setError("");
  };

  const handleReset = () => {
    if (
      hasChanges &&
      !window.confirm("Discard your unsaved availability changes?")
    ) {
      return;
    }

    setAvailability(normalizeAvailability(savedAvailability));
    setError("");
    setSuccess("");
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    for (const { key, label } of days) {
      const schedule = availability[key];

      if (!schedule.enabled) continue;

      if (!schedule.startTime || !schedule.endTime) {
        setError(`${label}: please enter both opening and closing times.`);
        return;
      }

      if (schedule.startTime >= schedule.endTime) {
        setError(
          `${label}: the closing time must be later than the opening time.`,
        );
        return;
      }
    }

    try {
      setIsSaving(true);

      const normalized = normalizeAvailability(availability);
      const data = await updateAvailability(normalized);
      const saved = normalizeAvailability(data?.availability || normalized);

      setAvailability(saved);
      setSavedAvailability(saved);
      setSuccess("Your availability has been saved successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to save your availability. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Business management
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Availability
                </h1>
                <p className="mt-3 max-w-2xl text-slate-600">
                  Set the days and hours when customers can book your services.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchAvailability}
                disabled={isLoading || isSaving || hasChanges}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Loading..." : "Refresh schedule"}
              </button>
            </div>
          </div>
        </div>

        {!isLoading && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">Working days</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {enabledDays}{" "}
                <span className="text-base font-medium text-slate-500">
                  of 7
                </span>
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm font-medium text-slate-500">
                Schedule status
              </p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {hasChanges ? "Unsaved changes" : "All changes saved"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {hasChanges
                  ? "Save to apply your updated hours."
                  : "Your current schedule is up to date."}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div
            role="status"
            className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200"
          >
            <p className="text-slate-600">Loading your availability...</p>
          </div>
        ) : error && !availability ? (
          <div role="alert" className="rounded-2xl bg-red-50 p-6">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchAvailability}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Try again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div
                role="alert"
                className="rounded-xl bg-red-50 p-4 ring-1 ring-red-100"
              >
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl bg-green-50 p-4 ring-1 ring-green-100"
              >
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Weekly schedule
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Enable each working day and choose its opening and closing
                    times.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={copyScheduleToWeekdays}
                  className="self-start rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:self-auto"
                >
                  Copy Monday to weekdays
                </button>
              </div>

              <div className="divide-y divide-slate-200">
                {days.map(({ key, label }, index) => {
                  const schedule = availability[key] || defaultSchedule;

                  return (
                    <div
                      key={key}
                      className="grid gap-4 px-6 py-5 sm:grid-cols-[1fr_1fr_1fr] sm:items-center"
                    >
                      <div>
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={Boolean(schedule.enabled)}
                            onChange={(event) =>
                              handleDayChange(
                                key,
                                "enabled",
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                          />
                          <span className="font-semibold text-slate-900">
                            {label}
                          </span>
                        </label>

                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => copyPreviousDay(index)}
                            className="ml-7 mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900"
                          >
                            Copy previous day
                          </button>
                        )}
                      </div>

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-500">
                          Opens
                        </span>
                        <input
                          type="time"
                          value={schedule.startTime || ""}
                          disabled={!schedule.enabled}
                          onChange={(event) =>
                            handleDayChange(
                              key,
                              "startTime",
                              event.target.value,
                            )
                          }
                          required={schedule.enabled}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-slate-500">
                          Closes
                        </span>
                        <input
                          type="time"
                          value={schedule.endTime || ""}
                          disabled={!schedule.enabled}
                          onChange={(event) =>
                            handleDayChange(key, "endTime", event.target.value)
                          }
                          required={schedule.enabled}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
                className="rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Discard changes
              </button>

              <Link
                to="/dashboard"
                onClick={(event) => {
                  if (
                    hasChanges &&
                    !window.confirm("Leave without saving your changes?")
                  ) {
                    event.preventDefault();
                  }
                }}
                className="rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Back to dashboard
              </Link>

              <button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save availability"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default OwnerAvailability;
