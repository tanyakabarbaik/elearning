const Renderer = {
  renderChapter(chapterId) {
    const ch = Konten.chapters[chapterId];
    if (!ch) return;

    const wrapper = document.getElementById('contentWrapper');
    const totalModules = ch.modules.length;
    const progress = Progress.getProgress(chapterId, totalModules);

    let html = `
      <div class="chapter-header fade-slide-up">
        <h1 class="chapter-title">${ch.title}</h1>
        <div class="chapter-progress">
          <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
          <span class="progress-text">${progress}% selesai</span>
        </div>
      </div>
      <div class="module-list">`;

    ch.modules.forEach((mod, i) => {
      const done = Progress.getChapter(chapterId).completed.includes(mod.id);
      html += `
        <div class="card module-card fade-slide-up ${done ? 'done' : ''}" style="animation-delay:${i * 0.05}s" onclick="Router.navigate('${chapterId}', '${mod.id}')">
          <div class="module-card-header">
            <span class="module-number">${i + 1}</span>
            <div>
              <h3 class="module-title">${mod.title}</h3>
              <span class="module-status">${done ? '✅ Selesai' : '⏳ Belum dipelajari'}</span>
            </div>
          </div>
          <p class="module-desc">${mod.excerpt || ''}</p>
          <div class="module-meta">
            ${mod.quizIds && mod.quizIds.length ? `<span class="chip">${mod.quizIds.length} soal</span>` : ''}
            ${mod.diagram ? '<span class="chip">Diagram</span>' : ''}
          </div>
        </div>`;
    });

    html += '</div>';
    html += `<div class="quiz-summary fade-slide-up" id="chapterQuizSummary"></div>`;
    wrapper.innerHTML = html;

    const quizScore = Progress.getChapter(chapterId).quizScore;
    if (quizScore !== null) {
      document.getElementById('chapterQuizSummary').innerHTML = `
        <div class="card">
          <h3>Skor Kuis Bab Ini</h3>
          <div class="score-display">${quizScore}%</div>
        </div>`;
    }
  },

  renderModule(chapterId, moduleId) {
    const ch = Konten.chapters[chapterId];
    const mod = ch.modules.find(m => m.id === moduleId);
    if (!mod) return;

    Progress.markModule(chapterId, moduleId);

    const modIndex = ch.modules.findIndex(m => m.id === moduleId);
    const prevMod = modIndex > 0 ? ch.modules[modIndex - 1] : null;
    const nextMod = modIndex < ch.modules.length - 1 ? ch.modules[modIndex + 1] : null;

    const wrapper = document.getElementById('contentWrapper');

    let html = `
      <div class="module-view fade-slide-up">
        <button class="btn btn-ghost btn-sm" onclick="Router.navigate('${chapterId}')">← Kembali ke Bab</button>
        <h1 class="module-view-title">${mod.title}</h1>
        <div class="module-view-wrapper">
          <div class="content-column">
            <div class="module-content">${mod.content}</div>`;

    if (mod.keyPoints && mod.keyPoints.length) {
      html += `<div class="card key-points-card">
        <h3>Poin Kunci</h3>
        <div class="key-points">
          ${mod.keyPoints.map(kp => `<div class="key-point"><span class="kp-icon">✅</span> ${kp}</div>`).join('')}
        </div>
      </div>`;
    }

    if (mod.diagram) {
      html += `<div class="card diagram-card">
        <h3>Diagram</h3>
        <div class="diagram-container">${mod.diagram}</div>
      </div>`;
    }

    if (mod.quizIds && mod.quizIds.length) {
      html += `<div class="card quiz-card" id="quizContainer"></div>`;
    }

    html += `<div class="nav-buttons">
      ${prevMod ? `<button class="btn btn-ghost" onclick="Router.navigate('${chapterId}', '${prevMod.id}')">← ${prevMod.title}</button>` : '<div></div>'}
      ${nextMod ? `<button class="btn btn-primary" onclick="Router.navigate('${chapterId}', '${nextMod.id}')">${nextMod.title} →</button>` : `<button class="btn btn-primary" onclick="Router.navigate('${chapterId}')">Selesai Bab →</button>`}
    </div>`;

    html += `</div>`;
    html += Notes.render(chapterId, moduleId);
    html += `</div></div>`;
    wrapper.innerHTML = html;

    if (mod.quizIds && mod.quizIds.length) {
      const quizContainer = document.getElementById('quizContainer');
      Kuis.render(quizContainer, mod.quizIds);
    }

    Notes.init(chapterId, moduleId);
  },

  renderSidebar(activeChapter) {
    const nav = document.getElementById('sidebarNav');
    let html = '<div class="sidebar-section"><div class="sidebar-label">Daftar Bab</div>';
    Object.values(Konten.chapters).forEach(ch => {
      const totalMods = ch.modules.length;
      const prog = Progress.getProgress(ch.id, totalMods);
      let statusIcon = '○';
      if (prog === 100) statusIcon = '✅';
      else if (prog > 0) statusIcon = '◐';

      html += `<div class="sidebar-item ${ch.id === activeChapter ? 'active' : ''}" onclick="Router.navigate('${ch.id}')">
        <span class="sidebar-status">${statusIcon}</span>
        <div class="sidebar-item-content">
          <span class="sidebar-item-title">${ch.title}</span>
          <div class="sidebar-progress"><div class="sidebar-progress-fill" style="width:${prog}%"></div></div>
        </div>
      </div>`;
    });
    html += '</div>';
    nav.innerHTML = html;
  }
};
