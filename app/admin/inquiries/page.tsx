"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Inquiry {
  id: number;
  property_name: string | null;
  responses: string;
  created_at: string;
}

interface FormField {
  id: number;
  label: string;
  sort_order: number;
}

export default function Inquiries() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [fieldLabels, setFieldLabels] = useState<FormField[]>([]);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
      } else {
        setChecking(false);
        fetchData();
      }
    }
    checkUser();
  }, []);

  async function fetchData() {
    const { data: inquiryData } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    setInquiries((inquiryData as Inquiry[]) || []);

    const { data: fieldData } = await supabase
      .from("form_fields")
      .select("id, label, sort_order")
      .order("sort_order");
    setFieldLabels((fieldData as FormField[]) || []);
  }

  function parseResponses(raw: string): Record<string, string> {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  async function handleDelete(id: number) {
    if (confirm("Ye inquiry delete karni hai?")) {
      await supabase.from("inquiries").delete().eq("id", id);
      fetchData();
    }
  }

  if (checking) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-blue-900">Inquiries</h1>
        <a href="/admin" className="text-blue-700 text-sm font-medium">
          ← Back to Admin Panel
        </a>
      </div>

      <p className="text-gray-600 mb-6">
        Yahan wo saare log dikhenge jinhone form fill kiya hai.
      </p>

      {inquiries.length === 0 && (
        <p className="text-gray-500">Abhi tak koi inquiry nahi aayi.</p>
      )}

      <div className="space-y-4 max-w-3xl">
        {inquiries.map((inquiry) => {
          const responses = parseResponses(inquiry.responses);
          return (
            <div
              key={inquiry.id}
              className="bg-white p-5 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  {inquiry.property_name && (
                    <p className="text-sm text-blue-700 font-medium mb-1">
                      Property: {inquiry.property_name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {new Date(inquiry.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(inquiry.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(responses).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-semibold text-gray-700">{key}: </span>
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
