"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

// Create a local supabase client here to avoid relying on ../../lib/supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

type Property = {
  id: number;
  name: string;
  location: string;
  price: string;
  status: string;
};

type PropertyForm = Omit<Property, "id">;

export default function Admin() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState<PropertyForm>({
    name: "",
    location: "",
    price: "",
    status: "Available",
  });

  async function fetchProperties() {
    const { data } = await supabase
      .from("properties")
      .select("*");
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
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("properties").insert([form]);
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Property added!");
      setForm({ name: "", location: "", price: "", status: "Available" });
      fetchProperties();
    }
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

      {/* Add Property Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md mb-10 max-w-xl"
      >
        <h2 className="text-xl font-semibold mb-4">Add New Property</h2>

        <input
          type="text"
          placeholder="Property Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border p-2 rounded mb-3"
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="w-full border p-2 rounded mb-3"
          required
        />
        <input
          type="text"
          placeholder="Price (e.g. 50 Lakh)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full border p-2 rounded mb-3"
          required
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="Available">Available</option>
          <option value="Sold">Sold</option>
        </select>

        <button
          type="submit"
          className="bg-blue-900 text-white px-6 py-2 rounded hover:bg-blue-800"
        >
          Add Property
        </button>
      </form>

      {/* Property List */}
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
            <button
              onClick={() => handleDelete(p.id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
