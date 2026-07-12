export default function Home() {
  const properties = [
    {
      id: 1,
      name: "Luxury Villa",
      location: "Vadodara, Gujarat",
      price: "₹85 Lakh",
      status: "Available",
    },
    {
      id: 2,
      name: "2BHK Flat",
      location: "Alkapuri, Vadodara",
      price: "₹45 Lakh",
      status: "Available",
    },
    {
      id: 3,
      name: "3BHK Apartment",
      location: "Gotri, Vadodara",
      price: "₹65 Lakh",
      status: "Sold",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Pankaj Real Estate</h1>
        <div className="space-x-6 hidden md:flex">
          <a href="#home" className="hover:text-blue-300">Home</a>
          <a href="#properties" className="hover:text-blue-300">Properties</a>
          <a href="#contact" className="hover:text-blue-300">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="text-center py-20 px-4">
        <h2 className="text-4xl font-bold mb-4">Apna Sapno Ka Ghar Dhundhe</h2>
        <p className="text-gray-600 mb-8">Best properties, best prices, sabse pehle</p>
        
        <a
          href="#properties"
          className="bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 inline-block"
        >
          Properties Dekhein
        </a>
      </section>

      {/* Properties Section */}
      <section id="properties" className="px-8 pb-20">
        <h3 className="text-2xl font-bold mb-8 text-center">Hamari Properties</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="h-48 bg-gray-300 flex items-center justify-center text-gray-500">
                Property Image
              </div>
              <div className="p-4">
                <h4 className="text-xl font-semibold">{property.name}</h4>
                <p className="text-gray-600">{property.location}</p>
                <p className="text-blue-900 font-bold text-lg mt-2">
                  {property.price}
                </p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                    property.status === "Available"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {property.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-blue-900 text-white px-8 py-16 text-center">
        <h3 className="text-2xl font-bold mb-4">Hume Contact Karein</h3>
        <p className="mb-2">📞 Phone: +91 98765 43210</p>
        <p className="mb-2">✉️ Email: pankaj@realestate.com</p>
        <p>📍 Vadodara, Gujarat</p>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 text-center py-4 text-sm">
        © 2026 Pankaj Real Estate. All rights reserved.
      </footer>
    </main>
  );
}