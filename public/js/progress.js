const Progress = {
  _key: 'kacc_progress',
  _loaded: false,

  async init() {
    try {
      const res = await fetch('/api/progress');
      if (res.ok) {
        const serverData = await res.json();
        localStorage.setItem(this._key, JSON.stringify(serverData));
      }
    } catch (e) {
      console.error('Gagal memuat progress dari server');
    }
    this._loaded = true;
  },

  getAll() {
    try { return JSON.parse(localStorage.getItem(this._key)) || {}; }
    catch { return {}; }
  },

  getChapter(chapterId) {
    return this.getAll()[chapterId] || { completed: [], quizScore: null };
  },

  markModule(chapterId, moduleId) {
    const all = this.getAll();
    if (!all[chapterId]) all[chapterId] = { completed: [], quizScore: null };
    if (!all[chapterId].completed.includes(moduleId)) {
      all[chapterId].completed.push(moduleId);
    }
    this._persist(all);
  },

  setQuizScore(chapterId, score) {
    const all = this.getAll();
    if (!all[chapterId]) all[chapterId] = { completed: [], quizScore: null };
    all[chapterId].quizScore = score;
    this._persist(all);
  },

  getProgress(chapterId, totalModules) {
    const ch = this.getChapter(chapterId);
    return totalModules > 0 ? Math.round((ch.completed.length / totalModules) * 100) : 0;
  },

  _persist(all) {
    localStorage.setItem(this._key, JSON.stringify(all));
    const payload = {};
    for (const chId in all) {
      payload[chId] = { completed: all[chId].completed, quizScore: all[chId].quizScore };
    }
    fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {});
  },

  async reset() {
    try {
      const res = await fetch('/api/progress', { method: 'DELETE' });
      if (res.ok) {
        localStorage.setItem(this._key, '{}');
        return true;
      }
    } catch (e) {
      console.error('Gagal reset progress');
    }
    return false;
  }
};