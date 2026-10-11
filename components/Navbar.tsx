import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="w-full bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-lg font-bold tracking-tight">Nexus-IT</Link>
      <div className="flex gap-6 text-sm font-medium">
        <Link href="/products" className="hover:text-blue-400 transition-colors">Services</Link>
        <Link href="/rfd" className="hover:text-blue-400 transition-colors">Request Demo</Link>
        <Link href="/contact" className="hover:text-blue-400 transition-colors">Contact</Link>
        <Link href="/admin" className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors">Admin</Link>
      </div>
    </nav>
  );
}
