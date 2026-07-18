"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface MediaItem {
  url: string;
  caption: string;
}

interface Property {
  id: number;
  name: string;
  location: string;
  price: string;
  status: string;
  image_url?: string | null;
  description?: string | null;
  video_url?: string | null;
  gallery_urls?: string | null;
}

type PropertyForm = {
  name: string;
  location: string;
  price: string;
  status: string;
  description: string;
};

interface ExistingMediaItem extends MediaItem {
  replaceFile: File | null;
}

function parseMediaJSON(raw?: string | null): MediaItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

export default function Admin() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState<PropertyForm>({
    name: "",
    location: "",
    price: "",
    status: "Available",
    description: "",
  });

  const [existingGallery, setExistingGallery] = useState<ExistingMediaItem[]>([]);
  const [newGalleryItems, setNewGalleryItems] = useState<
    { file: File | null; caption: string }[]
  >([]);

  const [existingVideos, setExistingVideos] = useState<ExistingMediaItem[]>([]);
  const [newVideoItems, setNewVideoItems] = useState<
    { file: File | null; caption: string }[]
  >([]);

  async function fetchProperties() {
    const { data } = await supabase.from("properties").select("*").order("id");
    setProperties((data as Property[]) || []);
  }

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setChecking(false);
      }
    }
    checkUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function uploadFile(file: File) {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("property-images")
      .upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("property-images").getPublicUrl(fileName);
    return data.publicUrl;
  }

  function updateExistingGalleryCaption(index: number, caption: string) {
    const updated = [...existingGallery];
    updated[index] = { ...updated[index], caption };
    setExistingGallery(updated);
  }
  function updateExistingGalleryFile(index: number, file: File | null) {
    const updated = [...existingGallery];
    updated[index] = { ...updated[index], replaceFile: file };
    setExistingGallery(updated);
  }
  function removeExistingGalleryItem(index: number) {
    setExistingGallery(existingGallery.filter((_, i) => i !== index));
  }

  function addGalleryRow() {
    setNewGalleryItems([...newGalleryItems, { file: null, caption: "" }]);
  }
  function updateGalleryRow(index: number, field: "file" | "caption", value: any) {
    const updated = [...newGalleryItems];
    updated[index] = { ...updated[index], [field]: value };
    setNewGalleryItems(updated);
  }
  function removeNewGalleryRow(index: number) {
    setNewGalleryItems(newGalleryItems.filter((_, i) => i !== index));
  }

  function updateExistingVideoCaption(index: number, caption: string) {
    const updated = [...existingVideos];
    updated[index] = { ...updated[index], caption };
    setExistingVideos(updated);
  }
  function updateExistingVideoFile(index: number, file: File | null) {
    const updated = [...existingVideos];
    updated[index] = { ...updated[index], replaceFile: file };
    setExistingVideos(updated);
  }
  function removeExistingVideoItem(index: number) {
    setExistingVideos(existingVideos.filter((_, i) => i !== index));
  }

  function addVideoRow() {
    setNewVideoItems([...newVideoItems, { file: null, caption: "" }]);
  }
  function updateVideoRow(index: number, field: "file" | "caption", value: any) {
    const updated = [...newVideoItems];
    updated[index] = { ...updated[index], [field]: value };
    setNewVideoItems(updated);
  }
  function removeNewVideoRow(index: number) {
    setNewVideoItems(newVideoItems.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrl = existingCoverUrl;
      if (coverFile) {
        imageUrl = await uploadFile(coverFile);
      }

      const processedExistingGallery: MediaItem[] = [];
      for (const item of existingGallery) {
        if (item.replaceFile) {
          const url = await uploadFile(item.replaceFile);
          processedExistingGallery.push({ url, caption: item.caption });
        } else {
          processedExistingGallery.push({ url: item.url, caption: item.caption });
        }
      }

      const uploadedGallery: MediaItem[] = [];
      for (const item of newGalleryItems) {
        if (item.file) {
          const url = await uploadFile(item.file);
          uploadedGallery.push({ url, caption: item.caption });
        }
      }
      const finalGallery = [...processedExistingGallery, ...uploadedGallery];

      const processedExistingVideos: MediaItem[] = [];
      for (const item of existingVideos) {
        if (item.replaceFile) {
          const url = await uploadFile(item.replaceFile);
          processedExistingVideos.push({ url, caption: item.caption });
        } else {
          processedExistingVideos.push({ url: item.url, caption: item.caption });
        }
      }

      const uploadedVideos: MediaItem[] = [];
      for (const item of newVideoItems) {
        if (item.file) {
          const url = await uploadFile(item.file);
          uploadedVideos.push({ url, caption: item.caption });
        }
      }
      const finalVideos = [...processedExistingVideos, ...uploadedVideos];

      const payload = {
        ...form,
        image_url: imageUrl,
        gallery_urls: JSON.stringify(finalGallery),
        video_url: JSON.stringify(finalVideos),
      };

      let error;
      if (editingId) {
        const result = await supabase
          .from("properties")
          .update(payload)
          .eq("id", editingId);
        error = result.error;
      } else {
        const result = await supabase.from("properties").insert([payload]);
        error = result.error;
      }

      if (error) {
        alert("Error: " + error.message);
      } else {
        alert(editingId ? "Property updated!" : "Property added!");
        handleCancelEdit();
        fetchProperties();
      }
    } catch (err: any) {
      alert("Upload error: " + err.message);
    }

    setUploading(false);
  }

  function handleEdit(property: Property) {
    setForm({
      name: property.name,
      location: property.location,
      price: property.price,
      status: property.status,
      description: property.description || "",
    });
    setExistingCoverUrl(property.image_url || "");
    setExistingGallery(
      parseMediaJSON(property.gallery_urls).map((g) => ({ ...g, replaceFile: null }))
    );
    setExistingVideos(
      parseMediaJSON(property.video_url).map((v) => ({ ...v, replaceFile: null }))
    );
    setNewGalleryItems([]);
    setNewVideoItems([]);
    setCoverFile(null);
    setEditingId(property.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setForm({ name: "", location: "", price: "", status: "Available", description: "" });
    setCoverFile(null);
    setExistingCoverUrl("");
    setExistingGallery([]);
    setNewGalleryItems([]);
    setExistingVideos([]);
    setNewVideoItems([]);
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    if (confirm("Delete this property?")) {
      await supabase.from("properties").delete().eq("id", id);
      fetchProperties();
    }
  }

  if (checking) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8 text-blue-900">Admin Panel</h1>

      <button
        onClick={handleLogout}
        className="mb-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
      >
        Logout
      </button>

      <div className="flex gap-4 mb-6">
        <a href="/admin/forms" className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 text-sm">
          📝 Form Builder
        </a>
        <a href="/admin/inquiries" className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 text-sm">
          📨 View Inquiries
        </a>
        <a href="/admin/settings" className="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800 text-sm">
          ✏️ Edit Website Text
        </a>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md mb-10 max-w-2xl"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Property" : "Add New Property"}
        </h2>

        <input
          type="text"
          placeholder="Property Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border border-gray-400 p-2 rounded mb-3 text-gray-900"
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="w-full border border-gray-400 p-2 rounded mb-3 text-gray-900"
          required
        />
        <input
          type="text"
          placeholder="Price (e.g. 50 Lakh)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full border border-gray-400 p-2 rounded mb-3 text-gray-900"
          required
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="w-full border border-gray-400 p-2 rounded mb-3 text-gray-900"
        >
          <option value="Available">Available</option>
          <option value="Sold">Sold</option>
        </select>

        <textarea
          placeholder="Overall Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border border-gray-400 p-2 rounded mb-4 h-24 text-gray-900"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cover Photo (main image jo card par dikhegi)
        </label>
        {existingCoverUrl && (
          <img src={existingCoverUrl} className="w-24 h-24 object-cover rounded mb-2" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          className="w-full border border-gray-400 p-2 rounded mb-5 text-gray-900"
        />

        <div className="border-t pt-4 mb-5">
          <h3 className="font-semibold mb-3">Gallery Photos (caption ke saath)</h3>

          {existingGallery.map((item, i) => (
            <div key={i} className="mb-3 bg-gray-50 p-3 rounded">
              <div className="flex items-start gap-3 mb-2">
                <img
                  src={item.replaceFile ? URL.createObjectURL(item.replaceFile) : item.url}
                  className="w-16 h-16 object-cover rounded flex-shrink-0"
                />
                <textarea
                  value={item.caption}
                  onChange={(e) => updateExistingGalleryCaption(i, e.target.value)}
                  placeholder="Caption likho (e.g. Master Bedroom with balcony)"
                  className="flex-1 border border-gray-400 p-2 rounded text-sm text-gray-900 h-16"
                />
                <button
                  type="button"
                  onClick={() => removeExistingGalleryItem(i)}
                  className="text-red-600 text-sm flex-shrink-0"
                >
                  Remove
                </button>
              </div>
              <label className="block text-xs text-gray-600 mb-1">
                Photo replace karne ke liye naya select karo:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => updateExistingGalleryFile(i, e.target.files?.[0] || null)}
                className="w-full border border-gray-400 p-1 rounded text-xs text-gray-900"
              />
            </div>
          ))}

          {newGalleryItems.map((item, i) => (
            <div key={i} className="mb-3 bg-blue-50 p-3 rounded">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => updateGalleryRow(i, "file", e.target.files?.[0] || null)}
                className="w-full border border-gray-400 p-2 rounded text-sm text-gray-900 mb-2"
              />
              <textarea
                placeholder="Caption likho (e.g. Master Bedroom with balcony)"
                value={item.caption}
                onChange={(e) => updateGalleryRow(i, "caption", e.target.value)}
                className="w-full border border-gray-400 p-2 rounded text-sm text-gray-900 h-16 mb-2"
              />
              <button
                type="button"
                onClick={() => removeNewGalleryRow(i)}
                className="text-red-600 text-sm"
              >
                Remove This Photo
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addGalleryRow}
            className="text-blue-700 text-sm font-medium mt-1"
          >
            + Add Photo
          </button>
        </div>

        <div className="border-t pt-4 mb-5">
          <h3 className="font-semibold mb-3">Videos (caption ke saath)</h3>

          {existingVideos.map((item, i) => (
            <div key={i} className="mb-3 bg-gray-50 p-3 rounded">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-16 h-16 bg-gray-800 rounded flex items-center justify-center text-white flex-shrink-0">
                  🎬
                </div>
                <textarea
                  value={item.caption}
                  onChange={(e) => updateExistingVideoCaption(i, e.target.value)}
                  placeholder="Caption likho (e.g. Living Room Walkthrough)"
                  className="flex-1 border border-gray-400 p-2 rounded text-sm text-gray-900 h-16"
                />
                <button
                  type="button"
                  onClick={() => removeExistingVideoItem(i)}
                  className="text-red-600 text-sm flex-shrink-0"
                >
                  Remove
                </button>
              </div>
              {item.replaceFile && (
                <p className="text-xs text-green-700 mb-1">
                  Naya video select ho gaya: {item.replaceFile.name}
                </p>
              )}
              <label className="block text-xs text-gray-600 mb-1">
                Video replace karne ke liye naya select karo:
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => updateExistingVideoFile(i, e.target.files?.[0] || null)}
                className="w-full border border-gray-400 p-1 rounded text-xs text-gray-900"
              />
            </div>
          ))}

          {newVideoItems.map((item, i) => (
            <div key={i} className="mb-3 bg-blue-50 p-3 rounded">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => updateVideoRow(i, "file", e.target.files?.[0] || null)}
                className="w-full border border-gray-400 p-2 rounded text-sm text-gray-900 mb-2"
              />
              <textarea
                placeholder="Caption likho (e.g. Living Room Walkthrough)"
                value={item.caption}
                onChange={(e) => updateVideoRow(i, "caption", e.target.value)}
                className="w-full border border-gray-400 p-2 rounded text-sm text-gray-900 h-16 mb-2"
              />
              <button
                type="button"
                onClick={() => removeNewVideoRow(i)}
                className="text-red-600 text-sm"
              >
                Remove This Video
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addVideoRow}
            className="text-blue-700 text-sm font-medium mt-1"
          >
            + Add Video
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : editingId ? "Update Property" : "Add Property"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-gray-300 text-gray-800 px-6 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="text-xl font-semibold mb-4">All Properties</h2>
      <div className="space-y-3">
        {properties.map((p) => (
          <div
            key={p.id}
            className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-gray-600">
                {p.location} • {p.price} • {p.status}
              </p>
            </div>
            <div className="space-x-3">
              <button
                onClick={() => handleEdit(p)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(p.id)}
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
