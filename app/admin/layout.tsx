export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const links: [string, string][] = [
    ["/admin", "Products"],
    ["/admin/orders", "Orders"],
    ["/admin/settings", "Settings"],
  ];
  return (
    <>
      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", padding: "10px 16px", background: "#f4f2ec", borderBottom: "1px solid #eceae4" }}>
        {links.map(([h, n]) => (
          <a key={h} href={h} style={{ display: "inline-flex", alignItems: "center", minHeight: 44, padding: "0 18px", borderRadius: 999, background: "#0b1f3a", color: "#fff", fontWeight: 600, textDecoration: "none" }}>
            {n}
          </a>
        ))}
      </nav>
      {children}
    </>
  );
}
