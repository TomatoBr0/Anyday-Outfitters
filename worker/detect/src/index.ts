/**
 * Getup piece detector: one photo of several clothes in, one entry per piece out
 * (category, colour, short name, bounding box). The app sends its own category
 * and colour ids so this Worker never drifts from them.
 *
 * The Anthropic key lives only here, as a Worker secret. Photos are sent to the
 * Claude API for this one request and are not stored by the Worker.
 */
import Anthropic from '@anthropic-ai/sdk';

export interface Env {
  ANTHROPIC_API_KEY: string;
  /** Optional Cloudflare rate-limit binding (see wrangler.toml). */
  LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Piece {
  categoryId: string;
  colorId: string;
  secondaryColorIds: string[];
  name: string;
  /** Short refinement, e.g. "Crewneck" or "Chelsea". Empty if nothing useful. */
  detail: string;
  pattern: string;
  /** Empty when fit doesn't apply (shoes, accessories) or can't be seen. */
  fit: string;
  styleTags: string[];
  /** 1 = loungewear … 5 = black tie */
  formality: number;
  /** 1 = very light … 5 = heavy */
  warmth: number;
  waterResistant: boolean;
  box: Box;
}

/** The app's allowed values for each field, sent with every request. */
export interface Vocab {
  categories: string[];
  colors: string[];
  patterns: string[];
  fits: string[];
  styles: string[];
}

const MODEL = 'claude-opus-5-5';
const MAX_IMAGE_BASE64 = 2_000_000; // ~1.5 MB JPEG; the app sends ≤1024 px
const MAX_PIECES = 12;
const ID = /^[a-z][a-zA-Z0-9_-]{0,39}$/;

const PROMPT = `This photo shows one or more clothing items or accessories laid out or hung up.
List every separate garment, pair of shoes, or accessory you can see, up to ${MAX_PIECES}.
For each one give:
- categoryId: the closest category from the allowed list.
- colorId: its main colour from the allowed list; secondaryColorIds: up to 2 other clearly visible colours (often none).
- name: a short, plain name a person would use, e.g. "Navy crew-neck sweater" (max 5 words, no brand guesses).
- detail: one or two words that refine the type, e.g. "Crewneck", "Chelsea", "Bomber", or "" if nothing useful.
- pattern: from the allowed list ("solid" if plain).
- fit: how it is cut, from the allowed list, judged from its shape; use "" for shoes, accessories or when you can't tell.
- styleTags: 1 to 3 styles it suits, from the allowed list.
- formality: 1 loungewear, 2 casual, 3 smart casual, 4 dressy, 5 black tie.
- warmth: 1 very light (linen tee), 2 light, 3 medium (sweater), 4 warm, 5 heavy (parka).
- waterResistant: true only for rain shells, waterproof boots and similar.
- box: a tight bounding box around just that piece, as fractions of the image width and height (0 to 1), with x,y at the top-left corner.
Count a pair of shoes as one piece. Ignore people, hangers, furniture and backgrounds. If there are no clothes, return an empty list.`;

function schema(v: Vocab) {
  const num = { type: 'number' };
  const scale = { type: 'integer', enum: [1, 2, 3, 4, 5] };
  return {
    type: 'object',
    additionalProperties: false,
    required: ['pieces'],
    properties: {
      pieces: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['categoryId', 'colorId', 'secondaryColorIds', 'name', 'detail', 'pattern', 'fit', 'styleTags', 'formality', 'warmth', 'waterResistant', 'box'],
          properties: {
            categoryId: { type: 'string', enum: v.categories },
            colorId: { type: 'string', enum: v.colors },
            secondaryColorIds: { type: 'array', items: { type: 'string', enum: v.colors } },
            name: { type: 'string' },
            detail: { type: 'string' },
            pattern: { type: 'string', enum: v.patterns },
            fit: { type: 'string', enum: [...v.fits, ''] },
            styleTags: { type: 'array', items: { type: 'string', enum: v.styles } },
            formality: scale,
            warmth: scale,
            waterResistant: { type: 'boolean' },
            box: { type: 'object', additionalProperties: false, required: ['x', 'y', 'width', 'height'], properties: { x: num, y: num, width: num, height: num } },
          },
        },
      },
    },
  };
}

const clamp01 = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
const scale5 = (n: unknown, fallback: number) => (typeof n === 'number' && Number.isFinite(n) ? Math.min(5, Math.max(1, Math.round(n))) : fallback);
const pick = (list: unknown, allowed: Set<string>, max: number) =>
  Array.isArray(list) ? [...new Set(list.filter((x): x is string => typeof x === 'string' && allowed.has(x)))].slice(0, max) : [];

/** Keep only well-formed pieces with known ids and a usable box, clamped to the image. */
export function sanitizePieces(raw: unknown, v: Vocab): Piece[] {
  const list = (raw as { pieces?: unknown })?.pieces;
  if (!Array.isArray(list)) return [];
  const cats = new Set(v.categories);
  const cols = new Set(v.colors);
  const patterns = new Set(v.patterns);
  const fits = new Set(v.fits);
  const styles = new Set(v.styles);
  const out: Piece[] = [];
  for (const p of list.slice(0, MAX_PIECES)) {
    if (!p || typeof p !== 'object') continue;
    const { categoryId, colorId, secondaryColorIds, name, detail, pattern, fit, styleTags, formality, warmth, waterResistant, box } = p as Record<string, unknown>;
    if (typeof categoryId !== 'string' || !cats.has(categoryId)) continue;
    const b = (box ?? {}) as Record<string, unknown>;
    const x = clamp01(b.x);
    const y = clamp01(b.y);
    const width = Math.min(clamp01(b.width), 1 - x);
    const height = Math.min(clamp01(b.height), 1 - y);
    if (width < 0.03 || height < 0.03) continue;
    const primary = typeof colorId === 'string' && cols.has(colorId) ? colorId : v.colors[0];
    out.push({
      categoryId,
      colorId: primary,
      secondaryColorIds: pick(secondaryColorIds, new Set([...cols].filter((c) => c !== primary)), 2),
      name: typeof name === 'string' ? name.trim().slice(0, 60) : '',
      detail: typeof detail === 'string' ? detail.trim().slice(0, 30) : '',
      pattern: typeof pattern === 'string' && patterns.has(pattern) ? pattern : v.patterns[0],
      fit: typeof fit === 'string' && fits.has(fit) ? fit : '',
      styleTags: pick(styleTags, styles, 3),
      formality: scale5(formality, 2),
      warmth: scale5(warmth, 2),
      waterResistant: waterResistant === true,
      box: { x, y, width, height },
    });
  }
  return out;
}

function validIds(v: unknown): string[] | undefined {
  if (!Array.isArray(v) || !v.length || v.length > 120) return undefined;
  return v.every((s) => typeof s === 'string' && ID.test(s)) ? (v as string[]) : undefined;
}

// The iOS app doesn't need CORS; the web preview does.
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'access-control-max-age': '86400' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST' || url.pathname !== '/detect') return json({ error: 'not_found' }, 404);

    if (env.LIMITER) {
      const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
      if (!(await env.LIMITER.limit({ key: ip })).success) return json({ error: 'rate_limited' }, 429);
    }

    let body: { image?: unknown; categories?: unknown; colors?: unknown; patterns?: unknown; fits?: unknown; styles?: unknown };
    try {
      body = await request.json();
    } catch {
      return json({ error: 'bad_json' }, 400);
    }
    const categories = validIds(body.categories);
    const colors = validIds(body.colors);
    const patterns = validIds(body.patterns);
    const fits = validIds(body.fits);
    const styles = validIds(body.styles);
    const image = typeof body.image === 'string' ? body.image : '';
    if (!categories || !colors || !patterns || !fits || !styles || !image || image.length > MAX_IMAGE_BASE64 || !/^[A-Za-z0-9+/=]+$/.test(image)) return json({ error: 'bad_request' }, 400);

    // Pin auth and endpoint so nothing in the runtime environment can redirect the key.
    const vocab: Vocab = { categories, colors, patterns, fits, styles };
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, authToken: null, baseURL: 'https://api.anthropic.com' });
    try {
      const response = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 4000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: schema(vocab) } },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      });
      if (response.stop_reason === 'refusal') return json({ error: 'declined' }, 422);
      const text = response.content.find((b) => b.type === 'text');
      if (!text || text.type !== 'text') return json({ error: 'no_result' }, 502);
      return json({ pieces: sanitizePieces(JSON.parse(text.text), vocab) });
    } catch (error) {
      if (error instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503);
      if (error instanceof Anthropic.APIError) return json({ error: 'upstream', status: error.status }, 502);
      if (error instanceof SyntaxError) return json({ error: 'no_result' }, 502);
      throw error;
    }
  },
};
