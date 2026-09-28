export function LoadingState({ label = "Loading campus events…" }: { label?: string }) {
  return <div className="state-panel" role="status" aria-live="polite"><div className="loading-orbit" aria-hidden="true" /><p>{label}</p></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <div className="state-panel empty-state"><h3>{title}</h3><p>{description}</p>{action}</div>;
}
