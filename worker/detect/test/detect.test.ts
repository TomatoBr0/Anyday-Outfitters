import assert from 'node:assert/strict';
import { test } from 'node:test';

import worker, { sanitizePieces } from '../src/index.ts';

const CATS = ['tshirt', 'jeans', 'sneakers'];
const COLORS = ['white', 'denim', 'black'];

test('sanitizePieces drops unknown categories and tiny boxes, clamps the rest', () => {
  const out = sanitizePieces(
    {
      pieces: [
        { categoryId: 'tshirt', colorId: 'white', name: ' White tee ', box: { x: 0.1, y: 0.1, width: 0.3, height: 0.4 } },
        { categoryId: 'hat', colorId: 'black', name: 'Hat', box: { x: 0, y: 0, width: 0.2, height: 0.2 } },
        { categoryId: 'jeans', colorId: 'purple', name: 'Jeans', box: { x: 0.8, y: 0.5, width: 0.9, height: 0.9 } },
        { categoryId: 'sneakers', colorId: 'black', name: 'Speck', box: { x: 0.5, y: 0.5, width: 0.01, height: 0.5 } },
      ],
    },
    CATS,
    COLORS,
  );
  assert.equal(out.length, 2);
  assert.deepEqual(out[0], { categoryId: 'tshirt', colorId: 'white', name: 'White tee', box: { x: 0.1, y: 0.1, width: 0.3, height: 0.4 } });
  assert.equal(out[1].colorId, 'white'); // unknown colour falls back to the first allowed one
  assert.ok(Math.abs(out[1].box.width - 0.2) < 1e-9 && Math.abs(out[1].box.height - 0.5) < 1e-9);
  assert.deepEqual(sanitizePieces('nonsense', CATS, COLORS), []);
});

test('handler sends a structured-output vision request and returns clean pieces', async () => {
  const realFetch = globalThis.fetch;
  let sent: { url: string; headers: Headers; body: any } | undefined;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const r = new Request(input, init);
    sent = { url: r.url, headers: r.headers, body: await r.json() };
    const pieces = { pieces: [{ categoryId: 'jeans', colorId: 'denim', name: 'Blue jeans', box: { x: 0.5, y: 0.2, width: 0.4, height: 0.7 } }] };
    return new Response(
      JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5-5', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(pieces) }], usage: { input_tokens: 1, output_tokens: 1 } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;
  try {
    const req = new Request('https://x.dev/detect', { method: 'POST', body: JSON.stringify({ image: 'AAAA', categories: CATS, colors: COLORS }) });
    const res = await worker.fetch(req, { ANTHROPIC_API_KEY: 'test-key' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { pieces: [{ categoryId: 'jeans', colorId: 'denim', name: 'Blue jeans', box: { x: 0.5, y: 0.2, width: 0.4, height: 0.7 } }] });
    assert.ok(sent);
    assert.match(sent.url, /\/v1\/messages/);
    assert.equal(sent.headers.get('authorization'), 'Bearer test-key');
    assert.match(sent.url, /^https:\/\/api\.anthropic\.com\//);
    assert.match(sent.headers.get('anthropic-beta') ?? '', /server-side-fallback-2026-07-01/);
    assert.equal(sent.body.model, 'claude-opus-5-5');
    assert.equal(sent.body.fallbacks, 'default');
    assert.equal(sent.body.output_config.format.type, 'json_schema');
    assert.deepEqual(sent.body.output_config.format.schema.properties.pieces.items.properties.categoryId.enum, CATS);
    assert.equal(sent.body.messages[0].content[0].source.media_type, 'image/jpeg');
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('handler rejects bad input without calling Claude', async () => {
  const bad = [
    { image: 'AAAA', categories: [], colors: COLORS },
    { image: 'not base64!', categories: CATS, colors: COLORS },
    { image: 'AAAA', categories: ['<script>'], colors: COLORS },
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
