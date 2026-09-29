export function safeRedirectPath(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/discover";
  try {
    const target = new URL(value, "https://eventmesh.invalid");
    if (target.origin !== "https://eventmesh.invalid") return "/discover";
    return target.pathname + target.search + target.hash;
  } catch { return "/discover"; }
}
