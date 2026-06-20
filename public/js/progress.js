const Progress = {
  _key: 'kacc_progress',

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
    localStorage.setItem(this._key, JSON.stringify(all));
  },

  setQuizScore(chapterId, score) {
    const all = this.getAll();
    if (!all[chapterId]) all[chapterId] = { completed: [], quizScore: null };
    all[chapterId].quizScore = score;
    localStorage.setItem(this._key, JSON.stringify(all));
  },

  getProgress(chapterId, totalModules) {
    const ch = this.getChapter(chapterId);
    return totalModules > 0 ? Math.round((ch.completed.length / totalModules) * 100) : 0;
  }
};
