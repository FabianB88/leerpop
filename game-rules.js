'use strict';
(function (root) {
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function questionQueue(questions, { fromModule = 1, challenges = true, reviewIds = null, seenIds = [], random = Math.random } = {}) {
    const seen = new Set(seenIds);
    const review = reviewIds === null ? null : new Set(reviewIds);
    const unique = new Map();
    for (const question of questions) {
      if (question.module < fromModule || seen.has(question.id) || (!challenges && question.difficulty === 'hard')
        || (review && !review.has(question.id))) continue;
      unique.set(question.id, question);
    }
    const groups = new Map();
    for (const question of unique.values()) {
      if (!groups.has(question.module)) groups.set(question.module, []);
      groups.get(question.module).push(question);
    }
    return [...groups.keys()].sort((a, b) => a - b).flatMap(module => {
      const items = groups.get(module);
      return [...shuffle(items.filter(q => q.difficulty !== 'hard'), random), ...shuffle(items.filter(q => q.difficulty === 'hard'), random)];
    });
  }
  function reward(streak, correct, difficult = false) {
    if (!correct) return { streak: 0, color: 0, row: 0, points: 0 };
    const next = streak + 1;
    return { streak: next, color: next % 3 === 0 ? 1 : 0, row: difficult ? 1 : 0, points: difficult ? 200 : 100 };
  }
  function powerTargets(grid, type, color) {
    const cells = [];
    if (type === 'row') {
      const row = grid.findLastIndex(items => items.some(item => item !== null));
      if (row >= 0) grid[row].forEach((item, col) => { if (item !== null) cells.push([row, col]); });
    } else if (type === 'color') {
      grid.forEach((items, row) => items.forEach((item, col) => { if (item === color) cells.push([row, col]); }));
    }
    return cells;
  }
  root.LeerpopRules = { shuffle, questionQueue, reward, powerTargets };
  if (typeof module !== 'undefined') module.exports = root.LeerpopRules;
})(typeof window !== 'undefined' ? window : globalThis);
