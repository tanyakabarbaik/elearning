const Router = {
  currentChapter: null,
  currentModule: null,

  init() {
    window.addEventListener('popstate', (e) => {
      if (e.state) {
        this._route(e.state.chapter, e.state.module);
      }
    });
  },

  navigate(chapterId, moduleId) {
    this.currentChapter = chapterId;
    this.currentModule = moduleId || null;
    window.history.pushState({ chapter: chapterId, module: moduleId }, '', `#${chapterId}${moduleId ? '/' + moduleId : ''}`);
    this._route(chapterId, moduleId);

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const mainContent = document.getElementById('mainContent');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    if (window.innerWidth > 1024) {
      sidebar.classList.remove('closed');
      mainContent.classList.remove('sidebar-closed');
    }
  },

  _route(chapterId, moduleId) {
    Renderer.renderSidebar(chapterId);
    if (chapterId === 'evaluasi') {
      EvaluasiFinal.render();
    } else if (chapterId === 'referensi') {
      Renderer.renderReferensiAyat();
    } else if (moduleId) {
      Renderer.renderModule(chapterId, moduleId);
    } else {
      Renderer.renderChapter(chapterId);
    }
  }
};
