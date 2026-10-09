import { useEffect, useState } from "react";
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

function OwnerAvailability() {
  const [availability, setAvailability] = useState(createDefaultAvailability);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setIsLoading(true);
        setError("");

        const data = await getAvailability();

        if (data.availability) {
          setAvailability((current) => ({
            ...current,
            ...data.availability,
          }));
        }
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load your availability. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, []);

  const handleDayChange = (day, field, value) => {
    setAvailability((current) => ({
      ...current,
      [day]: {
        ...current[day],
        [field]: value,
      },
    }));

    setSuccess("");
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    for (const day of days) {
      const schedule = availability[day.key];

      if (!schedule.enabled) {
        continue;
      }

      if (
        !schedule.startTime ||
        !schedule.endTime ||
        schedule.startTime >= schedule.endTime
      ) {
        setError(
          `${day.label}: the start time must be earlier than the end time.`,
        );
        return;
      }
    }

    try {
      setIsSaving(true);

      const data = await updateAvailability(availability);

      if (data.availability) {
        setAvailability((current) => ({
          ...current,
          ...data.availability,
        }));
      }

      setSuccess("Your availability has been saved successfully.");
    } catch (error) {
      setError(
        error.response?.data?.message ||
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

            <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
              Availability
            </h1>

            <p className="mt-3 max-w-2xl text-slate-600">
              Choose the days and hours when customers can book your services.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">Loading your availability...</p>
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
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-lg font-bold text-slate-900">
                  Weekly schedule
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Enable each working day and set its opening and closing times.
                </p>
              </div>

              <div className="divide-y divide-slate-200">
                {days.map(({ key, label }) => {
                  const schedule = availability[key] || defaultSchedule;

                  return (
                    <div
                      key={key}
                      className="grid gap-4 px-6 py-5 sm:grid-cols-[1fr_1fr_1fr] sm:items-center"
                    >
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
              <Link
                to="/dashboard"
                className="rounded-lg border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSaving}
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
