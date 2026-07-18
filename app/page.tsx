"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import InquiryForm from "./components/InquiryForm";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

interface Property {
  id: number;
  name: string;
  location: string;
  price: string;
  status: string;
  image_url?: string | null;
}

interface Setting {
  key: string;
  value: string;
}

const SINGLE_DEFAULTS: Record<string, string> = {
  site_name: "Pankaj Real Estate",
  hero_title: "Apna Sapno Ka Ghar Dhundhe",
  hero_subtitle: "Best properties, best prices, sabse pehle",
  hero_button_text: "Properties Dekhein",
  properties_heading: "Hamari Properties",
  contact_heading: "Hume Contact Karein",
  footer_text: "© 2026 Pankaj Real Estate. All rights reserved.",
};



function parseSocial(raw: string): { platform: string; url: string } {
  try {
    const parsed = JSON.parse(raw);
    return { platform: parsed.platform || "", url: parsed.url || "" };
  } catch {
    return { platform: "", url: "" };
  }
}

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [single, setSingle] = useState<Record<string, string>>(SINGLE_DEFAULTS);
  const [phones, setPhones] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>([]);

  useEffect(() => {
    async function fetchProperties() {
      const { data, error } = await supabase.from("properties").select("*");
      if (!error) {
        setProperties((data as Property[]) || []);
      }
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
      const emailList: string[] = [];
      const addressList: string[] = [];
      const socialList: { platform: string; url: string }[] = [];

      rows.forEach((row) => {
        if (row.key === "phone") phoneList.push(row.value);
        else if (row.key === "email") emailList.push(row.value);
        else if (row.key === "address") addressList.push(row.value);
        else if (row.key === "social_link") socialList.push(parseSocial(row.value));
        else singleMap[row.key] = row.value;
      });

      setSingle(singleMap);
      setPhones(phoneList);
      setEmails(emailList);
      setAddresses(addressList);
      setSocials(socialList);
    }

    fetchProperties();
    fetchSettings();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Sticky Navbar */}
      <nav className="bg-blue-900 text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="text-xl font-bold">{single.site_name}</h1>
        <div className="space-x-6 hidden md:flex">
          <a href="#home" className="hover:text-blue-300">Home</a>
          <a href="#properties" className="hover:text-blue-300">Properties</a>
          <a href="#contact" className="hover:text-blue-300">Contact</a>
        </div>
      </nav>

      <section id="home" className="text-center py-20 px-4">
        <h2 className="text-4xl font-bold mb-4">{single.hero_title}</h2>
        <p className="text-gray-600 mb-8">{single.hero_subtitle}</p>
        <a href="#properties" className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800">
          {single.hero_button_text}
        </a>
      </section>

      <section id="properties" className="px-8 pb-20">
        <h3 className="text-2xl font-bold mb-8 text-center">{single.properties_heading}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-300 flex items-center justify-center text-gray-500 overflow-hidden">
                {property.image_url ? (
                  <img
                    src={property.image_url}
                    alt={property.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "No Image"
                )}
              </div>
              <div className="p-4">
                <h4 className="text-xl font-semibold">{property.name}</h4>
                <p className="text-gray-600">{property.location}</p>
                <p className="text-blue-900 font-bold text-lg mt-2">{property.price}</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                    property.status === "Available"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {property.status}
                </span>

                <a
                  href={`/properties/${property.id}`}
                  className="block mt-3 text-center bg-blue-900 text-white py-2 rounded hover:bg-blue-800"
                >
                  Read More
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-blue-900 text-white px-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold mb-4 text-center">{single.contact_heading}</h3>

          {phones.map((p, i) => (
            <p key={i} className="mb-2 text-center">📞 {p}</p>
          ))}
          {emails.map((e, i) => (
            <p key={i} className="mb-2 text-center">✉️ {e}</p>
          ))}
          {addresses.map((a, i) => (
            <p key={i} className="mb-2 text-center">📍 {a}</p>
          ))}

          {socials.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-6 mb-8">
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

          <div className="max-w-md mx-auto mt-8">
            <InquiryForm />
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 text-center py-6 text-sm">
        {socials.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-3">
            {socials.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 text-sm hover:text-white underline"
              >
                {s.platform}
              </a>
            ))}
          </div>
        )}
        {single.footer_text}
      </footer>
    </main>
  );
}
