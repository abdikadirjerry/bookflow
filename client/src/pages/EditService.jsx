import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getServiceById, updateService } from "../services/serviceService";

const SERVICE_CATEGORIES = [
  "Beauty & Personal Care",
  "Photography",
  "Home Services",
  "Tutoring",
  "Other",
];

const INITIAL_FORM_DATA = {
  name: "",
  category: "Other",
  description: "",
  duration: "",
  price: "",
};

function validateForm(formData) {
  const errors = {};
  const name = formData.name.trim();
  const description = formData.description.trim();
  const duration = Number(formData.duration);
  const price = Number(formData.price);

  if (!name) {
    errors.name = "Service name is required.";
  } else if (name.length < 2) {
    errors.name = "Use at least 2 characters.";
  } else if (name.length > 100) {
    errors.name = "Service name cannot exceed 100 characters.";
  }

  if (!SERVICE_CATEGORIES.includes(formData.category)) {
    errors.category = "Please select a valid service category.";
  }

  if (!description) {
    errors.description = "Service description is required.";
  } else if (description.length < 10) {
    errors.description = "Use at least 10 characters.";
  } else if (description.length > 1000) {
    errors.description = "Description cannot exceed 1,000 characters.";
  }

  if (formData.duration.trim() === "") {
    errors.duration = "Service duration is required.";
  } else if (
    !Number.isFinite(duration) ||
    !Number.isInteger(duration) ||
    duration < 1
  ) {
    errors.duration = "Enter a whole number of minutes, starting at 1.";
  }

  if (formData.price.trim() === "") {
    errors.price = "Service price is required.";
  } else if (!Number.isFinite(price) || price < 0) {
    errors.price = "Enter a valid price of zero or more.";
  } else if (Math.round(price * 100) !== price * 100) {
    errors.price = "Price can have at most 2 decimal places.";
  }

  return errors;
}

function getApiErrorMessage(error) {
  const status = error.response?.status;
  const message = error.response?.data?.message;

  if (status === 401 || status === 403) {
    return message || "You are not authorized to update this service.";
  }

  if (status === 400 || status === 422) {
    return (
      message || "Some service details are invalid. Please review the form."
    );
  }

  if (!error.response) {
    return "Unable to reach the server. Check your connection and try again.";
  }

  return message || "Unable to update the service. Please try again.";
}

function EditService() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoadingService, setIsLoadingService] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isActive = true;

    const fetchService = async () => {
      setIsLoadingService(true);
      setLoadError("");
      setSubmitError("");
      setErrors({});
      setFormData(INITIAL_FORM_DATA);

      try {
        const data = await getServiceById(serviceId);
        const service = data?.service;

        if (!service) {
          throw new Error(
            "Service information was not returned by the server.",
          );
        }

        if (!isActive) return;

        setFormData({
          name: service.name ?? "",
          category: SERVICE_CATEGORIES.includes(service.category)
            ? service.category
            : "Other",
          description: service.description ?? "",
          duration: String(service.duration ?? ""),
          price: String(service.price ?? ""),
        });
      } catch (error) {
        if (!isActive) return;

        setLoadError(
          error.response?.data?.message ||
            error.message ||
            "Unable to load this service. Please try again.",
        );
      } finally {
        if (isActive) {
          setIsLoadingService(false);
        }
      }
    };

    fetchService();

    return () => {
      isActive = false;
    };
  }, [serviceId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[name]) return currentErrors;

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });

    setSubmitError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSaving || isLoadingService || loadError) return;

    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    setSubmitError("");

    if (Object.keys(validationErrors).length > 0) {
      document.getElementById(Object.keys(validationErrors)[0])?.focus();
      return;
    }

    setIsSaving(true);

    try {
      await updateService(serviceId, {
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        duration: Number(formData.duration),
        price: Number(formData.price),
      });

      navigate("/owner/services");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = (fieldName) =>
    `w-full rounded-lg border px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 ${
      errors[fieldName] ? "border-red-500" : "border-slate-300"
    }`;

  if (isLoadingService) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <p className="text-slate-600">Loading service...</p>
          </div>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/owner/services"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Back to services
          </Link>

          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div
              role="alert"
              className="rounded-lg bg-red-50 p-4 ring-1 ring-red-100"
            >
              <h1 className="font-semibold text-red-800">
                Unable to load service
              </h1>
              <p className="mt-2 text-sm text-red-700">{loadError}</p>
            </div>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/owner/services"
          className="text-sm font-semibold text-slate-700 hover:text-slate-900"
        >
          ← Back to services
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Business management
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Edit service
          </h1>

          <p className="mt-3 text-slate-600">
            Update the information customers see when booking this service.
          </p>
        </header>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          {submitError && (
            <div
              role="alert"
              className="mb-6 rounded-lg bg-red-50 p-4 ring-1 ring-red-100"
            >
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Service name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                maxLength={100}
                required
                disabled={isSaving}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={inputClass("name")}
              />

              {errors.name && (
                <p id="name-error" className="mt-2 text-sm text-red-600">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Service category
              </label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={isSaving}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={
                  errors.category ? "category-error" : undefined
                }
                className={`${inputClass("category")} bg-white`}
              >
                {SERVICE_CATEGORIES.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryOption}
                  </option>
                ))}
              </select>

              {errors.category && (
                <p id="category-error" className="mt-2 text-sm text-red-600">
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
                maxLength={1000}
                required
                disabled={isSaving}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "description-error" : "description-count"
                }
                className={`${inputClass("description")} resize-y`}
              />

              <div className="mt-2 flex justify-between gap-3">
                {errors.description ? (
                  <p id="description-error" className="text-sm text-red-600">
                    {errors.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    At least 10 characters.
                  </p>
                )}

                <p
                  id="description-count"
                  className="shrink-0 text-sm text-slate-500"
                >
                  {formData.description.length}/1000
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="duration"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Duration (minutes)
                </label>

                <input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.duration)}
                  aria-describedby={
                    errors.duration ? "duration-error" : undefined
                  }
                  className={inputClass("duration")}
                />

                {errors.duration && (
                  <p id="duration-error" className="mt-2 text-sm text-red-600">
                    {errors.duration}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Price ($)
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  disabled={isSaving}
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={errors.price ? "price-error" : undefined}
                  className={inputClass("price")}
                />

                {errors.price && (
                  <p id="price-error" className="mt-2 text-sm text-red-600">
                    {errors.price}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <Link
                to="/owner/services"
                aria-disabled={isSaving}
                className={`rounded-lg border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 ${
                  isSaving ? "pointer-events-none opacity-60" : ""
                }`}
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving changes..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default EditService;
