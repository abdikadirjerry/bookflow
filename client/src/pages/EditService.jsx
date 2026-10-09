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

function EditService() {
  const { serviceId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    category: "Other",
    description: "",
    duration: "",
    price: "",
  });

  const [isLoadingService, setIsLoadingService] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchService = async () => {
      try {
        setIsLoadingService(true);
        setError("");

        const data = await getServiceById(serviceId);
        const service = data.service;

        setFormData({
          name: service.name || "",
          category: SERVICE_CATEGORIES.includes(service.category)
            ? service.category
            : "Other",
          description: service.description || "",
          duration: service.duration ?? "",
          price: service.price ?? "",
        });
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Unable to load this service. Please try again.",
        );
      } finally {
        setIsLoadingService(false);
      }
    };

    fetchService();
  }, [serviceId]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const name = formData.name.trim();
    const category = formData.category;
    const description = formData.description.trim();
    const duration = formData.duration;
    const price = formData.price;

    if (!name) {
      setError("Service name is required.");
      return;
    }

    if (name.length < 2) {
      setError("Service name must be at least 2 characters.");
      return;
    }

    if (!SERVICE_CATEGORIES.includes(category)) {
      setError("Please select a valid service category.");
      return;
    }

    if (!description) {
      setError("Service description is required.");
      return;
    }

    if (description.length < 10) {
      setError("Service description must be at least 10 characters.");
      return;
    }

    if (!duration) {
      setError("Service duration is required.");
      return;
    }

    if (
      !Number.isFinite(Number(duration)) ||
      Number(duration) < 1 ||
      !Number.isInteger(Number(duration))
    ) {
      setError("Service duration must be a whole number of at least 1 minute.");
      return;
    }

    if (price === "") {
      setError("Service price is required.");
      return;
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      setError("Please enter a valid price of zero or more.");
      return;
    }

    try {
      setIsSaving(true);

      await updateService(serviceId, {
        name,
        category,
        description,
        duration: Number(duration),
        price: Number(price),
      });

      navigate("/owner/services");
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to update the service. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

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

  if (error && !formData.name) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/owner/services"
            className="text-sm font-semibold text-slate-700 hover:text-slate-900"
          >
            ← Back to services
          </Link>

          <div
            role="alert"
            className="mt-6 rounded-2xl bg-red-50 p-6 ring-1 ring-red-100"
          >
            <h1 className="font-semibold text-red-800">
              Unable to load service
            </h1>

            <p className="mt-2 text-sm text-red-700">{error}</p>
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

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Business management
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
            Edit service
          </h1>

          <p className="mt-3 text-slate-600">
            Update the information customers see when booking this service.
          </p>
        </div>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg bg-red-50 p-4 ring-1 ring-red-100"
            >
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={isSaving}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
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
                disabled={isSaving}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              >
                {SERVICE_CATEGORIES.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>
                    {categoryOption}
                  </option>
                ))}
              </select>
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
                rows="5"
                value={formData.description}
                onChange={handleChange}
                disabled={isSaving}
                className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
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
                  disabled={isSaving}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Price
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <Link
                to="/owner/services"
                className="rounded-lg border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
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
        </div>
      </div>
    </main>
  );
}

export default EditService;
