import assert from 'node:assert/strict';
import { test } from 'node:test';

import worker, { sanitizePieces, type Vocab } from '../src/index.ts';

const VOCAB: Vocab = {
  categories: ['tshirt', 'jeans', 'sneakers'],
  colors: ['white', 'denim', 'black'],
  patterns: ['solid', 'stripe'],
  fits: ['relaxed', 'regular', 'slim'],
  styles: ['casual', 'minimalist', 'streetwear', 'classic'],
};
const full = {
  secondaryColorIds: [],
  detail: '',
  pattern: 'solid',
  fit: 'regular',
  styleTags: ['casual'],
  formality: 2,
  warmth: 2,
  waterResistant: false,
};

test('sanitizePieces drops unknown categories and tiny boxes, clamps the rest', () => {
  const out = sanitizePieces(
    {
      pieces: [
        { ...full, categoryId: 'tshirt', colorId: 'white', name: ' White tee ', detail: 'Crewneck', box: { x: 0.1, y: 0.1, width: 0.3, height: 0.4 } },
        { ...full, categoryId: 'hat', colorId: 'black', name: 'Hat', box: { x: 0, y: 0, width: 0.2, height: 0.2 } },
        { ...full, categoryId: 'jeans', colorId: 'purple', name: 'Jeans', box: { x: 0.8, y: 0.5, width: 0.9, height: 0.9 } },
        { ...full, categoryId: 'sneakers', colorId: 'black', name: 'Speck', box: { x: 0.5, y: 0.5, width: 0.01, height: 0.5 } },
      ],
    },
    VOCAB,
  );
  assert.equal(out.length, 2);
  assert.equal(out[0].name, 'White tee');
  assert.equal(out[0].detail, 'Crewneck');
  assert.deepEqual(out[0].box, { x: 0.1, y: 0.1, width: 0.3, height: 0.4 });
  assert.equal(out[1].colorId, 'white'); // unknown colour falls back to the first allowed one
  assert.ok(Math.abs(out[1].box.width - 0.2) < 1e-9 && Math.abs(out[1].box.height - 0.5) < 1e-9);
  assert.deepEqual(sanitizePieces('nonsense', VOCAB), []);
});

test('sanitizePieces keeps only allowed detail values', () => {
  const [p] = sanitizePieces(
    {
      pieces: [
        {
          categoryId: 'jeans',
          colorId: 'denim',
          secondaryColorIds: ['denim', 'black', 'neon', 'white', 'black'],
          name: 'Jeans',
          detail: 'Straight leg',
          pattern: 'paisley',
          fit: 'baggy',
          styleTags: ['casual', 'goth', 'classic', 'streetwear', 'minimalist'],
          formality: 9,
          warmth: 0.4,
          waterResistant: 'yes',
          box: { x: 0.2, y: 0.2, width: 0.3, height: 0.6 },
        },
      ],
    },
    VOCAB,
  );
  assert.deepEqual(p.secondaryColorIds, ['black', 'white']); // no repeat of the primary, max 2
  assert.equal(p.pattern, 'solid');
  assert.equal(p.fit, '');
  assert.deepEqual(p.styleTags, ['casual', 'classic', 'streetwear']);
  assert.equal(p.formality, 5);
  assert.equal(p.warmth, 1);
  assert.equal(p.waterResistant, false);
});

test('handler sends a structured-output vision request and returns clean pieces', async () => {
  const realFetch = globalThis.fetch;
  let sent: { url: string; headers: Headers; body: any } | undefined;
  const piece = { ...full, categoryId: 'jeans', colorId: 'denim', name: 'Blue jeans', fit: 'slim', styleTags: ['casual', 'classic'], box: { x: 0.5, y: 0.2, width: 0.4, height: 0.7 } };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const r = new Request(input, init);
    sent = { url: r.url, headers: r.headers, body: await r.json() };
    return new Response(
      JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ pieces: [piece] }) }], usage: { input_tokens: 1, output_tokens: 1 } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;
  try {
    const req = new Request('https://x.dev/detect', { method: 'POST', body: JSON.stringify({ image: 'AAAA', ...VOCAB }) });
    const res = await worker.fetch(req, { ANTHROPIC_API_KEY: 'test-key' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { pieces: [piece] });
    assert.ok(sent);
    assert.match(sent.url, /^https:\/\/api\.anthropic\.com\/v1\/messages/);
    assert.equal(sent.headers.get('authorization'), 'Bearer test-key');
    assert.match(sent.headers.get('anthropic-beta') ?? '', /server-side-fallback-2026-07-01/);
    assert.equal(sent.body.model, 'claude-opus-5-5');
    assert.equal(sent.body.fallbacks, 'default');
    assert.equal(sent.body.output_config.format.type, 'json_schema');
    const props = sent.body.output_config.format.schema.properties.pieces.items.properties;
    assert.deepEqual(props.categoryId.enum, VOCAB.categories);
    assert.deepEqual(props.fit.enum, [...VOCAB.fits, '']);
    assert.deepEqual(props.styleTags.items.enum, VOCAB.styles);
    assert.equal(sent.body.messages[0].content[0].source.media_type, 'image/jpeg');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('handler rejects bad input without calling Claude', async () => {
  const bad = [
    { image: 'AAAA', ...VOCAB, categories: [] },
    { image: 'not base64!', ...VOCAB },
    { image: 'AAAA', ...VOCAB, categories: ['<script>'] },
    { image: 'AAAA', categories: VOCAB.categories, colors: VOCAB.colors },
  ];
  for (const body of bad) {
    const res = await worker.fetch(new Request('https://x.dev/detect', { method: 'POST', body: JSON.stringify(body) }), { ANTHROPIC_API_KEY: 'k' });
    assert.equal(res.status, 400);
  }
  const notFound = await worker.fetch(new Request('https://x.dev/other'), { ANTHROPIC_API_KEY: 'k' });
  assert.equal(notFound.status, 404);
  const preflight = await worker.fetch(new Request('https://x.dev/detect', { method: 'OPTIONS' }), { ANTHROPIC_API_KEY: 'k' });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-headers'), 'content-type');
});
