type LogFields = Record<string, string | number | boolean | null>;

export function serverLog(action: string, fields: LogFields = {}) {
  // Deliberately omit announcement text, poster bytes, API keys, and student interests.
  console.info(JSON.stringify({ at: new Date().toISOString(), action, ...fields }));
}
