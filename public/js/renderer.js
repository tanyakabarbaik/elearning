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
        <div style="margin-bottom: 12px;"><button class="btn btn-ghost btn-sm" onclick="Router.navigate('${chapterId}')">← Kembali ke Bab</button></div>
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
        <div class="diagram-container">${Konten.svgDiagrams[mod.diagram]()}</div>
      </div>`;
    }

    if (mod.quizIds && mod.quizIds.length) {
      html += `<div class="card quiz-card" id="quizContainer"></div>`;
    }

    html += `<div class="nav-buttons">
      ${prevMod ? `<button class="btn btn-ghost" onclick="Router.navigate('${chapterId}', '${prevMod.id}')">← Sebelumnya</button>` : ''}
      ${nextMod ? `<button class="btn btn-primary" onclick="Router.navigate('${chapterId}', '${nextMod.id}')">Selanjutnya →</button>` : `<button class="btn btn-primary" onclick="Router.navigate('${chapterId}')">Selesai Bab →</button>`}
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderDashboard() {
    const wrapper = document.getElementById('contentWrapper');

    // compute stats
    const allProgress = Progress.getAll();
    let totalModules = 0, completedModules = 0;
    const chapters = Object.values(Konten.chapters);
    chapters.forEach(function(ch) {
      const total = ch.modules.length;
      totalModules += total;
      const chData = allProgress[ch.id];
      if (chData) completedModules += chData.completed ? chData.completed.length : 0;
    });
    const overallPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    const avgQuiz = Progress.getAverageQuizScore();
    const evalAccess = Progress.isEvaluasiAccessible();
    const finalData = Progress.getFinalExamData();

    let examIcon = '🔒', examValue = 'Terkunci', examSub = 'Selesaikan semua bab & kuis';
    if (finalData) { examIcon = '✅'; examValue = finalData.score + '%'; examSub = 'Selesai'; }
    else if (evalAccess.ok) { examIcon = '🔓'; examValue = 'Tersedia'; examSub = 'Ikuti ujian sekarang'; }

    let html = '<div class="dashboard-view fade-slide-up">';

    // Welcome
    html += '<div class="dashboard-welcome">' +
      '<h1>👋 Selamat Datang, ' + Auth.user.name + '</h1>' +
      '<p>Lanjutkan perjalanan belajarmu dari tempat terakhir kamu tinggalkan.</p>' +
    '</div>';

    // Stats grid
    html += '<div class="dashboard-stats">';
    html += '<div class="dashboard-stat"><div class="dashboard-stat-icon icon-modules">📚</div><div class="dashboard-stat-body"><div class="dashboard-stat-value">' + completedModules + '/' + totalModules + '</div><div class="dashboard-stat-label">Modul Selesai</div></div></div>';
    html += '<div class="dashboard-stat"><div class="dashboard-stat-icon icon-quiz">📝</div><div class="dashboard-stat-body"><div class="dashboard-stat-value">' + avgQuiz + '%</div><div class="dashboard-stat-label">Rata-rata Skor Kuis</div></div></div>';
    html += '<div class="dashboard-stat"><div class="dashboard-stat-icon icon-exam">' + examIcon + '</div><div class="dashboard-stat-body"><div class="dashboard-stat-value">' + examValue + '</div><div class="dashboard-stat-label">Ujian Final</div><div class="dashboard-stat-sub">' + examSub + '</div></div></div>';
    html += '<div class="dashboard-stat"><div class="dashboard-stat-icon icon-progress">📊</div><div class="dashboard-stat-body"><div class="dashboard-stat-value">' + overallPct + '%</div><div class="dashboard-stat-label">Progress Keseluruhan</div></div></div>';
    html += '</div>';

    // Chapter progress list
    html += '<div class="dashboard-section-title">📋 Progress per Bab</div>';
    html += '<div class="dashboard-chapter-list">';
    chapters.forEach(function(ch) {
      const total = ch.modules.length;
      const prog = Progress.getProgress(ch.id, total);
      const chData = allProgress[ch.id];
      const quizScore = chData ? chData.quizScore : null;
      let fillClass = 'f0';
      if (prog === 100) fillClass = 'f100';
      else if (prog > 0) fillClass = 'f50';
      const done = prog === 100;
      const check = done ? '<span class="check">✅</span>' : '';
      html += '<div class="dashboard-chapter-row ' + (done ? 'done' : '') + '" onclick="Router.navigate(\'' + ch.id + '\')">' +
        '<div class="dashboard-chapter-num">' + ch.id + '</div>' +
        '<div class="dashboard-chapter-info"><div class="dashboard-chapter-title">' + ch.title + check + '</div></div>' +
        '<div class="dashboard-chapter-progress"><div class="dashboard-chapter-bar"><div class="dashboard-chapter-fill ' + fillClass + '" style="width:' + prog + '%"></div></div><div class="dashboard-chapter-pct">' + prog + '%</div></div>' +
        '<div class="dashboard-chapter-quiz">' +
          (quizScore !== null ? '<div class="dashboard-chapter-quiz-value">' + quizScore + '%</div><div class="dashboard-chapter-quiz-label">Kuis</div>' : '<div class="dashboard-chapter-quiz-value" style="color:#94a3b8;">—</div><div class="dashboard-chapter-quiz-label">Kuis</div>') +
        '</div>' +
      '</div>';
    });
    html += '</div>';

    // Quick actions
    html += '<div class="dashboard-section-title">⚡ Aksi Cepat</div>';
    html += '<div class="dashboard-actions">';
    // Find first incomplete module
    let resumeChapter = null, resumeModule = null;
    for (var ci = 0; ci < chapters.length; ci++) {
      var ch = chapters[ci];
      var chData = allProgress[ch.id];
      var doneIds = chData ? (chData.completed || []) : [];
      for (var mi = 0; mi < ch.modules.length; mi++) {
        if (!doneIds.includes(ch.modules[mi].id)) {
          resumeChapter = ch.id;
          resumeModule = ch.modules[mi].id;
          break;
        }
      }
      if (resumeChapter) break;
    }
    if (resumeChapter && resumeModule) {
      html += '<button class="btn btn-primary" onclick="Router.navigate(\'' + resumeChapter + '\',\'' + resumeModule + '\')">▶ Lanjut Belajar</button>';
    } else {
      html += '<button class="btn btn-primary" onclick="Router.navigate(\'' + chapters[0].id + '\',\'' + chapters[0].modules[0].id + '\')">▶ Mulai Belajar</button>';
    }
    html += '<button class="btn btn-ghost" onclick="Router.navigate(\'referensi\')">📖 Ayat Referensi</button>';
    html += '<button class="btn btn-ghost" onclick="Router.navigate(\'evaluasi\')">📋 Evaluasi Final</button>';
    html += '</div>';

    html += '</div>';
    wrapper.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  renderSidebar(activeChapter) {
    const nav = document.getElementById('sidebarNav');
    let html = '<div class="sidebar-section">' +
      '<div class="sidebar-item ' + (activeChapter === 'dashboard' ? 'active' : '') + '" onclick="Router.navigate(\'dashboard\')">' +
        '<span class="sidebar-status">🏠</span>' +
        '<div class="sidebar-item-content"><span class="sidebar-item-title">Beranda</span></div>' +
      '</div>' +
    '</div>';
    html += '<div class="sidebar-section"><div class="sidebar-label">Daftar Modul</div>';
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
    html += '<div class="sidebar-section">';
    if (Konten.referensiAyat) {
      html += `<div class="sidebar-item ${activeChapter === 'referensi' ? 'active' : ''}" onclick="Router.navigate('referensi')">
        <span class="sidebar-status">📖</span>
        <div class="sidebar-item-content">
          <span class="sidebar-item-title">Ayat Referensi</span>
          <span class="sidebar-item-sub">${Konten.referensiAyat.length} kategori</span>
        </div>
      </div>`;
    }
    html += '</div>';
    html += '<div class="sidebar-section">';
    const access = Progress.isEvaluasiAccessible();
    const finalData = Progress.getFinalExamData();
    let evalStatus = '○';
    let evalLabel = 'Belum tersedia';
    if (access.ok) { evalStatus = '🔓'; evalLabel = `${finalData ? finalData.score + '%' : 'Tersedia'}`; }
    else { evalStatus = '🔒'; evalLabel = 'Terkunci'; }
    html += `<div class="sidebar-item ${activeChapter === 'evaluasi' ? 'active' : ''}" onclick="Router.navigate('evaluasi')">
      <span class="sidebar-status">${evalStatus}</span>
      <div class="sidebar-item-content">
        <span class="sidebar-item-title">Evaluasi Final</span>
        <span class="sidebar-item-sub">${evalLabel}</span>
      </div>
    </div>`;
    html += '</div>';
    nav.innerHTML = html;
  },

  renderReferensiAyat() {
    const ref = Konten.referensiAyat;
    if (!ref) return;

    const wrapper = document.getElementById('contentWrapper');
    let html = `
      <div class="referensi-view fade-slide-up">
        <h1 class="referensi-title" style="font-size:28px;margin-bottom:8px;">📖 Ayat Referensi</h1>
        <p style="color:#64748b;margin-bottom:32px;">Ayat-ayat Alkitab Terjemahan Baru (TB) — Lembaga Alkitab Indonesia</p>`;

    ref.forEach((cat, ci) => {
      html += `<div class="referensi-kategori" style="margin-bottom:16px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        <div onclick="const c=document.getElementById('ref-body-${ci}');const i=document.getElementById('ref-icon-${ci}');c.style.display=c.style.display==='none'?'grid':'none';i.textContent=i.textContent==='▸'?'▾':'▸'" style="cursor:pointer;padding:14px 18px;background:#f8fafc;display:flex;align-items:center;justify-content:space-between;user-select:none;">
          <h2 style="font-size:16px;color:#d4a843;margin:0;">${cat.kategori}</h2>
          <span id="ref-icon-${ci}" style="font-size:18px;color:#94a3b8;transition:transform 0.2s;">▸</span>
        </div>
        <div id="ref-body-${ci}" style="display:none;padding:0 18px 14px;gap:8px;">`;

      cat.ayat.forEach((a, ai) => {
        html += `<div class="referensi-ayat" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;">
          <div style="display:flex;align-items:baseline;justify-content:space-between;">
            <span style="font-weight:700;color:#1e293b;font-size:13px;">${a.ref}</span>
            ${a.asal ? `<span style="font-size:11px;color:#94a3b8;background:#f1f5f9;padding:2px 8px;border-radius:4px;">${a.asal}</span>` : ''}
          </div>
          <p style="color:#475569;font-size:14px;margin:4px 0 0 0;line-height:1.5;">${a.teks}</p>
        </div>`;
      });

      html += `</div></div>`;
    });

    html += `</div>`;
    wrapper.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};
