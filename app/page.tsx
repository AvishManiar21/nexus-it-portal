// app/page.tsx
export default function HomePage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome to Nexus-IT</h1>
      <p>This is the starting point for the frontend application.</p>
      <p>Links: </p>
      <ul>
        <li><a href="/products">Products</a></li>
        <li><a href="/rfd">RFD Form</a></li>
        <li><a href="/contact">Contact Us</a></li>
        <li><a href="/admin">Admin Dashboard</a></li>
      </ul>
    </div>
  );
}