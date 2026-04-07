export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <section className="flex flex-col items-center justify-center text-center px-6 py-24 bg-zinc-900 text-white">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Nexus-IT Solutions</h1>
        <p className="text-lg text-zinc-300 max-w-xl mb-8">
          Enterprise-grade Cloud Services, Cybersecurity Solutions, and AI Analytics — built for modern businesses.
        </p>
        <div className="flex gap-4">
          <a href="/products" className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">Explore Services</a>
          <a href="/rfd" className="border border-white text-white hover:bg-white hover:text-zinc-900 font-medium px-6 py-3 rounded-lg transition-colors">Request a Demo</a>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-white mb-10 text-center">Our Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { title: "Cloud Services", desc: "Scalable cloud infrastructure tailored to your enterprise needs.", href: "/products/1" },
            { title: "Cybersecurity", desc: "End-to-end security solutions to protect your business assets.", href: "/products/2" },
            { title: "AI Analytics", desc: "Data-driven insights powered by advanced machine learning.", href: "/products/3" },
          ].map((service) => (
            <a key={service.title} href={service.href} className="block p-6 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-2">{service.title}</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">{service.desc}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-zinc-100 dark:bg-zinc-900 text-center px-6 py-12">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">Ready to get started? Reach out to our team.</p>
        <a href="/contact" className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">Contact Us</a>
      </section>
    </div>
  );
}