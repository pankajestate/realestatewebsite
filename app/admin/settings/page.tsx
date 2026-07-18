"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Setting {
  id: number;
  key: string;
  value: string;
  sort_order: number;
}

const SECTION_OPTIONS = [
  { value: "site_name", label: "Website Naam (Navbar)" },
  { value: "hero_title", label: "Hero Title" },
  { value: "hero_subtitle", label: "Hero Subtitle" },
  { value: "hero_button_text", label: "Hero Button Text" },
  { value: "properties_heading", label: "Properties Section Heading" },
  { value: "contact_heading", label: "Contact Section Heading" },
  { value: "phone", label: "Phone Number" },
  { value: "email", label: "Email" },
  { value: "address", label: "Address" },
  { value: "cta_heading", label: "Property Page CTA Heading" },
  { value: "cta_subtext", label: "Property Page CTA Subtext" },
  { value: "form_success_message", label: "Form Success Message (Thank You text)" },
  { value: "footer_text", label: "Footer Text" },
  { value: "social_link", label: "Social Media Link" },
];


function parseSocial(raw: string): { platform: string; url: string } {
  try {
    const parsed = JSON.parse(raw);
    return { platform: parsed.platform || "", url: parsed.url || "" };
  } catch {
    return { platform: "", url: "" };
  }
}

export default function SiteSettings() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState<Setting[]>([]);

  const [section, setSection] = useState(SECTION_OPTIONS[0].value);
  const [value, setValue] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setChecking(false);
        fetchSettings();
      }
    }
    checkUser();
  }, []);

  async function fetchSettings() {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .order("key")
      .order("sort_order");
    setSettings((data as Setting[]) || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalValue =
      section === "social_link"
        ? JSON.stringify({ platform: socialPlatform, url: socialUrl })
        : value;

    if (editingId) {
      await supabase
        .from("site_settings")
        .update({ key: section, value: finalValue })
        .eq("id", editingId);
    } else {
      const sameSection = settings.filter((s) => s.key === section);
      await supabase.from("site_settings").insert([
        { key: section, value: finalValue, sort_order: sameSection.length },
      ]);
    }

    resetForm();
    fetchSettings();
  }

  function resetForm() {
    setSection(SECTION_OPTIONS[0].value);
    setValue("");
    setSocialPlatform("");
    setSocialUrl("");
    setEditingId(null);
  }

  function handleEdit(setting: Setting) {
    setSection(setting.key);
    if (setting.key === "social_link") {
      const parsed = parseSocial(setting.value);
      setSocialPlatform(parsed.platform || "");
      setSocialUrl(parsed.url);
    } else {
      setValue(setting.value);
    }
    setEditingId(setting.id);
  }

  async function handleDelete(id: number) {
    if (confirm("Ye entry delete karni hai?")) {
      await supabase.from("site_settings").delete().eq("id", id);
      fetchSettings();
    }
  }

  async function moveItem(sectionKey: string, index: number, direction: "up" | "down") {
    const items = settings.filter((s) => s.key === sectionKey);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    for (let i = 0; i < items.length; i++) {
      await supabase
        .from("site_settings")
        .update({ sort_order: i })
        .eq("id", items[i].id);
    }
    fetchSettings();
  }

  if (checking) {
    return <p className="p-8">Loading...</p>;
  }

  const grouped = SECTION_OPTIONS.map((opt) => ({
    ...opt,
    items: settings.filter((s) => s.key === opt.value),
  }));

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Website Text Settings</h1>
        <a href="/admin" className="text-blue-700 text-sm font-medium">
          ← Back to Admin Panel
        </a>
      </div>

      <p className="text-gray-600 mb-6">
        Yahan aap website ka koi bhi text add/edit/delete kar sakte ho. Multiple phone number, email, social links bhi add kar sakte ho.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md mb-10 max-w-xl"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Entry" : "Add New Entry"}
        </h2>

        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
        <select
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="w-full border border-gray-400 p-2 rounded mb-3 text-gray-900"
        >
          {SECTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {section === "social_link" ? (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platform Name (koi bhi likh sakte ho)
            </label>
            <input
              type="text"
              placeholder="e.g. Instagram, Pinterest, Telegram..."
              value={socialPlatform}
              onChange={(e) => setSocialPlatform(e.target.value)}
              className="w-full border border-gray-400 p-2 rounded mb-3 text-gray-900"
              required
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Link</label>
            <input
              type="url"
              placeholder="https://instagram.com/yourprofile"
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              className="w-full border border-gray-400 p-2 rounded mb-4 text-gray-900"
              required
            />
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            {section === "hero_subtitle" ||
            section === "cta_subtext" ||
            section === "footer_text" ||
            section === "form_success_message" ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border border-gray-400 p-2 rounded mb-4 h-20 text-gray-900"
                required
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border border-gray-400 p-2 rounded mb-4 text-gray-900"
                required
              />
            )}
          </>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800"
          >
            {editingId ? "Update Entry" : "Add Entry"}
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

      <div className="space-y-6 max-w-2xl">
        {grouped.map((group) => (
          <div key={group.value}>
            <h3 className="font-semibold text-gray-800 mb-2">{group.label}</h3>
            {group.items.length === 0 ? (
              <p className="text-sm text-gray-400 mb-2">Koi entry nahi hai.</p>
            ) : (
              <div className="space-y-2">
                {group.items.map((item, index) => {
                  const social = group.value === "social_link" ? parseSocial(item.value) : null;
                  return (
                    <div
                      key={item.id}
                      className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center"
                    >
                      <p className="text-gray-900 text-sm flex-1">
                        {social ? `${social.platform}: ${social.url}` : item.value}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => moveItem(group.value, index, "up")}
                          className="text-gray-500 hover:text-gray-800"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveItem(group.value, index, "down")}
                          className="text-gray-500 hover:text-gray-800"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

