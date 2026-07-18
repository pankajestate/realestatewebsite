"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function FormBuilder() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);

  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setChecking(false);
        fetchFields();
      }
    }
    checkUser();
  }, []);

  async function fetchFields() {
    const { data } = await supabase
      .from("form_fields")
      .select("*")
      .order("sort_order");
    setFields((data as FormField[]) || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      label,
      field_type: fieldType,
      options: fieldType === "dropdown" ? options : null,
      required,
      sort_order: editingId
        ? fields.find((f) => f.id === editingId)?.sort_order || 0
        : fields.length,
    };

    if (editingId) {
      await supabase.from("form_fields").update(payload).eq("id", editingId);
    } else {
      await supabase.from("form_fields").insert([payload]);
    }

    resetForm();
    fetchFields();
  }

  function resetForm() {
    setLabel("");
    setFieldType("text");
    setOptions("");
    setRequired(true);
    setEditingId(null);
  }

  function handleEdit(field: FormField) {
    setLabel(field.label);
    setFieldType(field.field_type);
    setOptions(field.options || "");
    setRequired(field.required);
    setEditingId(field.id);
  }

  async function handleDelete(id: number) {
    if (confirm("Ye question delete karna hai?")) {
      await supabase.from("form_fields").delete().eq("id", id);
      fetchFields();
    }
  }

  async function moveField(index: number, direction: "up" | "down") {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;

    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;

    for (let i = 0; i < newFields.length; i++) {
      await supabase
        .from("form_fields")
        .update({ sort_order: i })
        .eq("id", newFields[i].id);
    }
    fetchFields();
  }

  if (checking) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Form Builder</h1>
        <a href="/admin" className="text-blue-700 text-sm font-medium">
          ← Back to Admin Panel
        </a>
      </div>

      <p className="text-gray-600 mb-6">
        Yahan aap decide karo ki inquiry form mein kaunse questions honge (jaise Name, Age, Gender, State).
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md mb-10 max-w-xl"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Question" : "Add New Question"}
        </h2>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Label
        </label>
        <input
          type="text"
          placeholder="e.g. Age, Gender, State"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full border border-gray-400 p-2 rounded mb-3 text-gray-900"
          required
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Field Type
        </label>
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value)}
          className="w-full border border-gray-400 p-2 rounded mb-3 text-gray-900"
        >
          <option value="text">Short Text (e.g. Name)</option>
          <option value="number">Number (e.g. Age)</option>
          <option value="email">Email</option>
          <option value="phone">Phone Number</option>
          <option value="dropdown">Dropdown (choose from options)</option>
          <option value="textarea">Long Text (message box)</option>
        </select>

        {fieldType === "dropdown" && (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Options (comma se separate karo)
            </label>
            <input
              type="text"
              placeholder="e.g. Male,Female,Other"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              className="w-full border border-gray-400 p-2 rounded mb-3 text-gray-900"
            />
          </>
        )}

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={required}
            onChange={(e) => setRequired(e.target.checked)}
          />
          <span className="text-sm text-gray-700">Ye question zaroori hai (required)</span>
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800"
          >
            {editingId ? "Update Question" : "Add Question"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="text-xl font-semibold mb-4">Current Form Questions</h2>
      <div className="space-y-3 max-w-xl">
        {fields.length === 0 && (
          <p className="text-gray-500">
            Koi question nahi hai abhi. Upar se add karo (Name aur Phone default rahenge form mein).
          </p>
        )}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </p>
              <p className="text-sm text-gray-600">
                Type: {field.field_type}
                {field.options && ` • Options: ${field.options}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => moveField(index, "up")}
                className="text-gray-500 hover:text-gray-800"
              >
                ↑
              </button>
              <button
                onClick={() => moveField(index, "down")}
                className="text-gray-500 hover:text-gray-800"
              >
                ↓
              </button>
              <button
                onClick={() => handleEdit(field)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(field.id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
