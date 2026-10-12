const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../scores.js'), 'utf8');
function setup() {
  const stored = new Map();
  const docs = new Map();
  const ref = id => ({
    async set(data) { if (docs.has(id)) throw Error('permission-denied'); docs.set(id, data); },
    async get() { return { data: () => docs.get(id) }; }
  });
  const collection = { doc: ref, orderBy: () => ({ limit: () => ({ onSnapshot: (_, callback) => {
    callback({ docs: [...docs].sort((a, b) => b[1].score - a[1].score).slice(0, 10).map(([id, data]) => ({ id, data: () => data })), metadata: { fromCache: false } });
    return () => {};
  } }) }) };
  const db = { collection: () => ({ doc: course => ({ collection: () => ({ ...collection, doc: id => ref(course + '/' + id) }) }) }) };
  const window = { firebase: { initializeApp: () => ({ firestore: () => db }), firestore: { FieldValue: { serverTimestamp: () => 'server-time' } } }, LEERPOP_FIREBASE: { projectId: 'test' } };
  const context = { window, localStorage: { getItem: key => stored.get(key), setItem: (key, value) => stored.set(key, value) }, module: { exports: {} } };
  vm.runInNewContext(source, context);
  return { scores: context.module.exports, docs };
}
const entry = { id: 'round-123456789', course: 'sustainability', name: ' Test Player ', score: 100, level: 1, answered: 1 };
test('names are normalized, bounded, and empty names rejected', () => {
  const { scores } = setup();
  assert.equal(scores.cleanName('  Test   Player\u200b  '), 'Test Player');
  assert.equal(scores.cleanName('Ａlice'), 'Alice');
  assert.equal(scores.cleanName('a'.repeat(30)).length, 24);
  assert.equal(scores.validEntry({ ...entry, name: '\u200b ' }), false);
  assert.equal(scores.rememberName('  Zoë '), 'Zoë');
  assert.equal(scores.rememberedName(), 'Zoë');
});
test('invalid scores and unknown courses are rejected', async () => {
  const { scores, docs } = setup();
  for (const patch of [{ score: -1 }, { score: Infinity }, { score: 1.5 }, { course: 'own_custom' }, { answered: 0 }, { level: 0 }, { id: '../escape' }]) {
    await assert.rejects(scores.save({ ...entry, ...patch }));
  }
  assert.equal(docs.size, 0);
});
test('confirmed retries save only one document', async () => {
  const { scores, docs } = setup();
  await scores.save(entry);
  await scores.save(entry);
  assert.equal(docs.size, 1);
  assert.equal(docs.get('sustainability/' + entry.id).name, 'Test Player');
});
test('existing scores cannot be replaced through retry handling', async () => {
  const { scores, docs } = setup();
  await scores.save(entry);
  await assert.rejects(scores.save({ ...entry, score: 999 }));
  assert.equal(docs.get('sustainability/' + entry.id).score, 100);
});
test('different courses have separate score documents', async () => {
  const { scores, docs } = setup();
  await scores.save(entry);
  await scores.save({ ...entry, course: 'ethics' });
  assert.equal(docs.size, 2);
});
