"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import InquiryForm from "../../components/InquiryForm";

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

interface Setting {
  key: string;
  value: string;
}

const SINGLE_DEFAULTS: Record<string, string> = {
  site_name: "Pankaj Real Estate",
  cta_heading: "Interested in this property?",
  cta_subtext: "Hume contact karein aur visit book karein",
};

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

function parseSocial(raw: string): { platform: string; url: string } {
  try {
    const parsed = JSON.parse(raw);
    return { platform: parsed.platform || "", url: parsed.url || "" };
  } catch {
    return { platform: "", url: "" };
  }
}

export default function PropertyDetails() {
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [activeMedia, setActiveMedia] = useState<{ url: string; caption: string; type: "image" | "video" } | null>(null);
  const [loading, setLoading] = useState(true);
  const [single, setSingle] = useState<Record<string, string>>(SINGLE_DEFAULTS);
  const [phones, setPhones] = useState<string[]>([]);
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>([]);

  useEffect(() => {
    async function fetchProperty() {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", params.id)
        .single();

      if (!error && data) {
        const prop = data as Property;
        setProperty(prop);
        if (prop.image_url) {
          setActiveMedia({ url: prop.image_url, caption: prop.name, type: "image" });
        }
      }
      setLoading(false);
    }

    async function fetchSettings() {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .order("key")
        .order("sort_order");

      const rows = (data as Setting[]) || [];
      const singleMap = { ...SINGLE_DEFAULTS };
      const phoneList: string[] = [];
      const socialList: { platform: string; url: string }[] = [];

      rows.forEach((row) => {
        if (row.key === "phone") phoneList.push(row.value);
        else if (row.key === "social_link") socialList.push(parseSocial(row.value));
        else singleMap[row.key] = row.value;
      });

      setSingle(singleMap);
      setPhones(phoneList);
      setSocials(socialList);
    }

    fetchProperty();
    fetchSettings();
  }, [params.id]);

  if (loading) {
    return <p className="p-8 text-center">Loading...</p>;
  }

  if (!property) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Property nahi mili.</p>
      </main>
    );
  }

  const gallery = parseMediaJSON(property.gallery_urls);
  const videos = parseMediaJSON(property.video_url);

  const allThumbnails: { url: string; caption: string; type: "image" | "video" }[] = [];
  if (property.image_url) {
    allThumbnails.push({ url: property.image_url, caption: property.name, type: "image" });
  }
  gallery.forEach((g) => allThumbnails.push({ ...g, type: "image" }));
  videos.forEach((v) => allThumbnails.push({ ...v, type: "video" }));

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <a href="/" className="text-xl font-bold">{single.site_name}</a>
        <a href="/" className="hover:text-blue-300">← Back to Home</a>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        {/* Main Display */}
        <div className="w-full h-96 bg-gray-300 rounded-lg overflow-hidden mb-2">
          {activeMedia ? (
            activeMedia.type === "video" ? (
              <video src={activeMedia.url} controls className="w-full h-full object-cover" />
            ) : (
              <img
                src={activeMedia.url}
                alt={activeMedia.caption}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              No Media
            </div>
          )}
        </div>
        {activeMedia?.caption && (
          <p className="text-gray-600 text-sm mb-4">{activeMedia.caption}</p>
        )}

        {/* Thumbnails */}
        {allThumbnails.length > 1 && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {allThumbnails.map((item, i) => (
              <div key={i} className="flex-shrink-0 text-center">
                <div
                  onClick={() => setActiveMedia(item)}
                  className={`w-24 h-24 rounded overflow-hidden cursor-pointer border-2 relative ${
                    activeMedia?.url === item.url ? "border-blue-900" : "border-transparent"
                  }`}
                >
                  {item.type === "video" ? (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-xl">
                      ▶
                    </div>
                  ) : (
                    <img src={item.url} className="w-full h-full object-cover" />
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1 w-24 truncate">{item.caption}</p>
              </div>
            ))}
          </div>
        )}

        {/* Property Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
              <p className="text-gray-600 mt-1">{property.location}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                property.status === "Available"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {property.status}
            </span>
          </div>

          <p className="text-blue-900 font-bold text-2xl mb-4">{property.price}</p>

          {property.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Description</h3>
              <p className="text-gray-700 whitespace-pre-line">{property.description}</p>
            </div>
          )}
        </div>

        {/* Inquiry Form */}
        <div className="mb-10">
          <InquiryForm propertyName={property.name} />
        </div>

        {/* Contact CTA */}
        <div className="bg-blue-900 text-white rounded-lg p-6 text-center mb-10">
          <h3 className="text-xl font-semibold mb-2">{single.cta_heading}</h3>
          <p className="mb-4">{single.cta_subtext}</p>
          {phones.map((p, i) => (
            <p key={i}>📞 {p}</p>
          ))}

          {socials.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-blue-900 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-100"
                >
                  {s.platform}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
