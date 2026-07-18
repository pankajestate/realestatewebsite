"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface FormField {
  id: number;
  label: string;
  field_type: string;
  options: string | null;
  required: boolean;
  sort_order: number;
}

interface InquiryFormProps {
  propertyName?: string;
}

const DEFAULT_SUCCESS_MESSAGE =
  "Dhanyawad! Aapka message mil gaya hai, hum jaldi hi contact karenge.";

export default function InquiryForm({ propertyName }: InquiryFormProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState(DEFAULT_SUCCESS_MESSAGE);

  useEffect(() => {
    async function fetchFields() {
      const { data } = await supabase
        .from("form_fields")
        .select("*")
        .order("sort_order");
      setFields((data as FormField[]) || []);
    }

    async function fetchSuccessMessage() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "form_success_message")
        .order("sort_order")
        .limit(1)
        .maybeSingle();

      if (data?.value) {
        setSuccessMessage(data.value);
      }
    }

    fetchFields();
    fetchSuccessMessage();
  }, []);

  function handleChange(label: string, value: string) {
    setValues({ ...values, [label]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase.from("inquiries").insert([
      {
        property_name: propertyName || null,
        responses: JSON.stringify(values),
      },
    ]);

    setSubmitting(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setSubmitted(true);
      setValues({});
    }
  }

  if (fields.length === 0) {
    return null;
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-300 rounded-lg p-6 text-center">
        <p className="text-green-700 font-medium whitespace-pre-line">
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Enquiry Form {propertyName ? `- ${propertyName}` : ""}
      </h3>

      {fields.map((field) => (
        <div key={field.id} className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>

          {field.field_type === "dropdown" ? (
            <select
              required={field.required}
              value={values[field.label] || ""}
              onChange={(e) => handleChange(field.label, e.target.value)}
              className="w-full border border-gray-400 p-2 rounded text-gray-900"
            >
              <option value="">Select</option>
              {(field.options || "")
                .split(",")
                .map((opt) => opt.trim())
                .filter((opt) => opt !== "")
                .map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
            </select>
          ) : field.field_type === "textarea" ? (
            <textarea
              required={field.required}
              value={values[field.label] || ""}
              onChange={(e) => handleChange(field.label, e.target.value)}
              className="w-full border border-gray-400 p-2 rounded text-gray-900 h-24"
            />
          ) : (
            <input
              type={
                field.field_type === "email"
                  ? "email"
                  : field.field_type === "number"
                  ? "number"
                  : field.field_type === "phone"
                  ? "tel"
                  : "text"
              }
              required={field.required}
              value={values[field.label] || ""}
              onChange={(e) => handleChange(field.label, e.target.value)}
              className="w-full border border-gray-400 p-2 rounded text-gray-900"
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 disabled:opacity-50 mt-2"
      >
        {submitting ? "Sending..." : "Submit"}
      </button>
    </form>
  );
}
