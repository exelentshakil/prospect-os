// Model access with an env-driven fallback chain. A deprecated model id cannot
// break the product: the chain is tried in order and, if every model fails or
// no key is configured, callers fall back to the deterministic path.

const CHAIN = (process.env.GEMINI_MODELS ?? "gemini-2.5-flash,gemini-2.0-flash")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

export function aiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export interface AiResult {
  text: string;
  model: string;
}

export async function generate(prompt: string, maxTokens = 2048): Promise<AiResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  for (const model of CHAIN) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens },
          }),
          signal: AbortSignal.timeout(20000),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      if (text.trim()) return { text: text.trim(), model };
    } catch {
      continue;
    }
  }
  return null;
}

export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{") >= 0 ? raw.indexOf("{") : raw.indexOf("[");
  const end = Math.max(raw.lastIndexOf("}"), raw.lastIndexOf("]"));
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
