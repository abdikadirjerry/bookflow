import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  getAvailability,
  updateAvailability,
} from "../services/availabilityService";

import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";

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

  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const saveInProgressRef = useRef(false);

  const hasChanges = useMemo(
    () => !schedulesEqual(availability, savedAvailability),
    [availability, savedAvailability],
  );

  const enabledDays = useMemo(
    () => days.filter(({ key }) => availability[key]?.enabled).length,
    [availability],
  );

  const fetchAvailability = useCallback(async () => {
    if (saveInProgressRef.current) return;

    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await getAvailability();
      const normalized = normalizeAvailability(data?.availability);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setAvailability(normalized);
      setSavedAvailability(normalized);
    } catch (requestError) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to load your availability. Please try again.",
      );
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchAvailability();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [fetchAvailability]);

  useEffect(() => {
    if (!hasChanges || isLoading || isSaving) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
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
    const mondaySchedule = { ...availability.monday };

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

    if (saveInProgressRef.current || !hasChanges) return;

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

    saveInProgressRef.current = true;
    const requestId = ++requestIdRef.current;

    setIsSaving(true);

    try {
      const normalized = normalizeAvailability(availability);
      const data = await updateAvailability(normalized);
      const saved = normalizeAvailability(data?.availability || normalized);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setAvailability(saved);
      setSavedAvailability(saved);
      setSuccess("Your availability has been saved successfully.");
    } catch (requestError) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setError(
        requestError.response?.data?.message ||
          "Unable to save your availability. Please try again.",
      );
    } finally {
      saveInProgressRef.current = false;

      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsSaving(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
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
          className="text-sm font-semibold text-slate-600 transition hover:text-slate-900"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-5">
          <PageHeader
            eyebrow="Business management"
            title="Availability"
            description="Set the days and hours when customers can book your services."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={fetchAvailability}
                disabled={isLoading || isSaving || hasChanges}
              >
                {isLoading ? "Loading..." : "Refresh schedule"}
              </Button>
            }
          />
        </div>

        {!isLoading && !error && (
          <section
            aria-label="Availability statistics"
            className="mb-6 grid gap-4 sm:grid-cols-2"
          >
            <Card>
              <p className="text-sm font-medium text-slate-500">Working days</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {enabledDays}{" "}
                <span className="text-base font-medium text-slate-500">
                  of 7
                </span>
              </p>
            </Card>

            <Card>
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
            </Card>
          </section>
        )}

        {isLoading ? (
          <Card>
            <div role="status" aria-live="polite" className="py-8 text-center">
              <p className="text-slate-600">Loading your availability...</p>
            </div>
          </Card>
        ) : error && !savedAvailability ? (
          <Card>
            <div role="alert">
              <p className="text-sm text-red-700">{error}</p>
              <div className="mt-4">
                <Button type="button" onClick={fetchAvailability}>
                  Try again
                </Button>
              </div>
            </div>
          </Card>
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

            <Card padding={0}>
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

                <Button
                  type="button"
                  variant="secondary"
                  onClick={copyScheduleToWeekdays}
                  disabled={isSaving || isLoading}
                >
                  Copy Monday to weekdays
                </Button>
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
                            disabled={isSaving}
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
                            disabled={isSaving}
                            onClick={() => copyPreviousDay(index)}
                            className="ml-7 mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
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
                          disabled={!schedule.enabled || isSaving}
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
                          disabled={!schedule.enabled || isSaving}
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
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                disabled={!hasChanges || isSaving}
              >
                Discard changes
              </Button>

              <Button type="submit" disabled={isSaving || !hasChanges}>
                {isSaving ? "Saving..." : "Save availability"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

export default OwnerAvailability;
