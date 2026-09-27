export function LoadingState({ label = "Loading campus events…" }: { label?: string }) {
  return <div className="state-panel"><div className="loading-orbit" /><p>{label}</p></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="state-panel empty-state"><div className="empty-glyph">✳</div><h3>{title}</h3><p>{description}</p>{action}</div>;
}
