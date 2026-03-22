export default function TabLayout({ sidebar, children }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ width: 220, flexShrink: 0 }}>
        {sidebar}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
}
