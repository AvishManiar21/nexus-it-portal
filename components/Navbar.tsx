export default function Navbar() {
  return (
    <nav className="w-full bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
      <a href="/" className="text-lg font-bold tracking-tight">Nexus-IT</a>
      <div className="flex gap-6 text-sm font-medium">
        <a href="/products" className="hover:text-blue-400 transition-colors">Services</a>
        <a href="/rfd" className="hover:text-blue-400 transition-colors">Request Demo</a>
        <a href="/contact" className="hover:text-blue-400 transition-colors">Contact</a>
        <a href="/admin" className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors">Admin</a>
      </div>
    </nav>
  );
}