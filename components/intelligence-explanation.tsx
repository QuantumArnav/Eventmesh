export function IntelligenceExplanation({ title, score, reasons, warnings = [] }: { title: string; score?: number; reasons: string[]; warnings?: string[] }) {
  return <div className="intelligence-explanation" aria-label={title}><div><strong>{title}</strong>{score !== undefined && <span>{score}/100</span>}</div><ul>{reasons.map((reason) => <li key={reason}>✓ {reason}</li>)}{warnings.map((warning) => <li className="warning" key={warning}>⚠ {warning}</li>)}</ul></div>;
}
