'use strict';
(function (root) {
  const NAME_KEY = 'leerpop-player-name-v1';
  const COURSES = ['sustainability', 'ethics'];
  function cleanName(value) {
    return String(value || '').normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/gu, ' ').trim().slice(0, 24);
  }
  function validEntry(entry) {
    return COURSES.includes(entry.course) && cleanName(entry.name).length > 0
      && Number.isInteger(entry.score) && entry.score > 0 && entry.score <= 1000000000
      && Number.isInteger(entry.level) && entry.level >= 1 && entry.level <= 1000000
      && Number.isInteger(entry.answered) && entry.answered >= 1 && entry.answered <= 10000000
      && typeof entry.id === 'string' && /^[a-zA-Z0-9_-]{10,80}$/.test(entry.id);
  }
  function rememberedName() {
    try { return cleanName(localStorage.getItem(NAME_KEY)); } catch { return ''; }
  }
  function rememberName(value) {
    const name = cleanName(value);
    try { localStorage.setItem(NAME_KEY, name); } catch { /* The shared board still works. */ }
    return name;
  }
  function sessionId() {
    return root.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
  let db;
  function database() {
    if (db) return db;
    if (!root.firebase || !root.LEERPOP_FIREBASE) throw new Error('Het gedeelde scorebord kon niet worden geladen. Vernieuw de pagina.');
    const app = root.firebase.initializeApp(root.LEERPOP_FIREBASE, 'leerpop');
    db = app.firestore();
    return db;
  }
  function entries(course) {
    if (!COURSES.includes(course)) throw new Error('Het gedeelde scorebord is voor de twee vaste cursussen.');
    return database().collection('leerpop_scores').doc(course).collection('entries');
  }
  function listen(course, onScores, onError) {
    try {
      return entries(course).orderBy('score', 'desc').limit(10).onSnapshot({ includeMetadataChanges: true }, snapshot => {
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onScores(records, !snapshot.metadata.fromCache);
      }, onError);
    } catch (error) { onError(error); return () => {}; }
  }
  async function save(entry) {
    const record = { ...entry, name: cleanName(entry.name) };
    if (!validEntry(record)) throw new Error('Vul een naam in en speel eerst een ronde met punten.');
    const ref = entries(record.course).doc(record.id);
    const fields = { name: record.name, score: record.score, level: record.level, answered: record.answered,
      createdAt: root.firebase.firestore.FieldValue.serverTimestamp() };
    try { await ref.set(fields); }
    catch (error) {
      // Retrying a confirmed or uncertain submission must not add another score.
      const existing = await ref.get({ source: 'server' }).catch(() => null);
      const data = existing?.data();
      if (!data || data.name !== fields.name || data.score !== fields.score
        || data.level !== fields.level || data.answered !== fields.answered) throw error;
    }
    return record;
  }
  root.LeerpopScores = { cleanName, validEntry, rememberedName, rememberName, sessionId, listen, save };
  if (typeof module !== 'undefined') module.exports = root.LeerpopScores;
})(typeof window !== 'undefined' ? window : globalThis);
