const EvaluasiFinal = {
  _questions: [],
  _answers: {},
  _currentIndex: 0,
  _submitted: false,
  _timer: null,
  _timeRemaining: 5400,
  _score: null,

  init() {
    this._questions = Konten.finalQuizzes ? Object.values(Konten.finalQuizzes) : [];
    this._answers = {};
    this._currentIndex = 0;
    this._submitted = false;
    this._score = null;
    this._timeRemaining = 5400;
  },

  render() {
    this.init();
    const access = Progress.isEvaluasiAccessible();
    const wrapper = document.getElementById('contentWrapper');

    if (!access.ok) {
      wrapper.innerHTML = `
        <div class="evaluasi-locked fade-slide-up">
          <div class="evaluasi-locked-card">
            <span class="evaluasi-locked-icon">🔒</span>
            <h1>Evaluasi Final Terkunci</h1>
            <p>Untuk mengakses Evaluasi Final, Anda harus:</p>
            <ul>
              <li>✅ Menyelesaikan 100% seluruh modul di semua bab</li>
              <li>✅ Rata-rata nilai kuis seluruh bab &gt; 70%</li>
            </ul>
            <div class="evaluasi-locked-reason">
              <strong>Penyebab:</strong> ${access.reason}
            </div>
            <button class="btn btn-primary" onclick="Router.navigate('1')">Kembali ke Bab</button>
          </div>
        </div>`;
      return;
    }

    if (!this._questions.length) {
      wrapper.innerHTML = `
        <div class="evaluasi-locked fade-slide-up">
          <div class="evaluasi-locked-card">
            <span class="evaluasi-locked-icon">⚠️</span>
            <h1>Evaluasi Final Belum Tersedia</h1>
            <p>Soal evaluasi final belum dimuat. Silakan muat ulang halaman.</p>
            <button class="btn btn-primary" onclick="location.reload()">Muat Ulang</button>
          </div>
        </div>`;
      return;
    }

    this._renderQuestion();
    this._startTimer();
  },

  _renderQuestion() {
    const wrapper = document.getElementById('contentWrapper');
    const q = this._questions[this._currentIndex];
    const total = this._questions.length;
    const num = this._currentIndex + 1;

    let html = `
      <div class="evaluasi-container fade-slide-up">
        <div class="evaluasi-header">
          <div class="evaluasi-header-left">
            <h1>Evaluasi Final</h1>
            <span class="evaluasi-progress-text">Soal ${num} dari ${total}</span>
          </div>
          <div class="evaluasi-timer" id="evaluasiTimer">
            <span class="timer-icon">⏱</span>
            <span id="timerDisplay">${this._formatTime(this._timeRemaining)}</span>
          </div>
        </div>
        <div class="evaluasi-progress-bar">
          <div class="evaluasi-progress-fill" style="width:${(num / total) * 100}%"></div>
        </div>
        <div class="evaluasi-question-card">
          <div class="evaluasi-question-number">${num}</div>
          <p class="evaluasi-question-text">${q.question}</p>
          <div class="evaluasi-options" id="evaluasiOptions">
            ${q.options.map((opt, oi) => `
              <div class="evaluasi-option ${this._answers[q.id] === oi ? 'selected' : ''} ${this._submitted ? (oi === q.correct ? 'correct' : (this._answers[q.id] === oi ? 'wrong' : '')) : ''}" data-index="${oi}" onclick="${this._submitted ? '' : `EvaluasiFinal._select(${oi})`}">
                <span class="evaluasi-radio">${this._answers[q.id] === oi ? '◉' : '○'}</span>
                <span>${opt}</span>
              </div>
            `).join('')}
          </div>
          ${this._submitted ? `
            <div class="evaluasi-feedback ${this._answers[q.id] === q.correct ? 'feedback-correct' : 'feedback-wrong'}">
              ${this._answers[q.id] === q.correct ? '✅' : '❌'} ${q.feedback}
            </div>
          ` : ''}
        </div>
        <div class="evaluasi-nav">
          <button class="btn btn-ghost" onclick="EvaluasiFinal._prev()" ${num === 1 ? 'disabled' : ''}>← Sebelumnya</button>
          <button class="btn btn-ghost" onclick="EvaluasiFinal._navigateTo(0)">Awal</button>
          <span class="evaluasi-nav-status">${Object.keys(this._answers).length}/${total} terjawab</span>
          <button class="btn btn-ghost" onclick="EvaluasiFinal._navigateTo(${total - 1})">Akhir</button>
          ${num === total ? `<button class="btn btn-primary evaluasi-submit-btn" onclick="EvaluasiFinal._submit()">Kumpulkan Jawaban</button>` : `<button class="btn btn-primary" onclick="EvaluasiFinal._next()">Selanjutnya →</button>`}
        </div>
      </div>`;

    wrapper.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _select(index) {
    if (this._submitted) return;
    const q = this._questions[this._currentIndex];
    this._answers[q.id] = index;
    this._renderQuestion();
  },

  _next() {
    if (this._currentIndex < this._questions.length - 1) {
      this._currentIndex++;
      this._renderQuestion();
    }
  },

  _prev() {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this._renderQuestion();
    }
  },

  _navigateTo(index) {
    if (index >= 0 && index < this._questions.length) {
      this._currentIndex = index;
      this._renderQuestion();
    }
  },

  _submit() {
    const total = this._questions.length;
    const answered = Object.keys(this._answers).length;
    if (answered < total) {
      showConfirmModal(`Anda baru menjawab ${answered} dari ${total} soal. Yakin ingin mengumpulkan?`, 'Soal yang belum terjawab akan dianggap salah.').then(ok => {
        if (ok) this._doSubmit();
      });
      return;
    }
    this._doSubmit();
  },

  _doSubmit() {
    this._stopTimer();
    this._submitted = true;
    const total = this._questions.length;
    let correct = 0;
    this._questions.forEach(q => {
      if (this._answers[q.id] === q.correct) correct++;
    });
    this._score = Math.round((correct / total) * 100);

    const prev = Progress.getFinalExamData();
    const bestScore = prev && prev.score ? Math.max(prev.score, this._score) : this._score;
    Progress.setFinalExamData({ score: bestScore, answers: this._answers, submitted: true });
    this._renderResults(correct, total);
  },

  _renderResults(correct, total) {
    const wrapper = document.getElementById('contentWrapper');
    wrapper.innerHTML = `
      <div class="evaluasi-results fade-slide-up">
        <div class="evaluasi-results-card">
          <div class="evaluasi-results-icon">${this._score >= 70 ? '🎉' : '💪'}</div>
          <h1>${this._score >= 70 ? 'Selamat!' : 'Tetap Semangat!'}</h1>
          <div class="evaluasi-score-display">
            <div class="evaluasi-score-circle ${this._score >= 70 ? 'score-pass' : 'score-fail'}">
              <span class="evaluasi-score-value">${this._score}%</span>
            </div>
          </div>
          <p class="evaluasi-score-detail">${correct} dari ${total} soal benar</p>
          ${this._score >= 70 ? '<p class="evaluasi-score-message">Anda telah lulus Evaluasi Final KACC!</p>' : '<p class="evaluasi-score-message">Terus belajar dan tingkatkan pemahaman Anda. Anda dapat mengulang kapan saja.</p>'}
          <div class="evaluasi-results-actions">
            <button class="btn btn-primary" onclick="EvaluasiFinal._review()">Tinjau Jawaban</button>
            <button class="btn btn-ghost" onclick="EvaluasiFinal.render()">Ulangi Evaluasi</button>
            <button class="btn btn-ghost" onclick="Router.navigate('1')">Kembali ke Bab 1</button>
          </div>
        </div>
      </div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _review() {
    this._renderQuestion();
  },

  _startTimer() {
    this._stopTimer();
    this._timer = setInterval(() => {
      this._timeRemaining--;
      const display = document.getElementById('timerDisplay');
      if (display) display.textContent = this._formatTime(this._timeRemaining);

      const container = document.getElementById('evaluasiTimer');
      if (container) {
        if (this._timeRemaining <= 300) container.classList.add('timer-warning');
        if (this._timeRemaining <= 60) container.classList.add('timer-critical');
      }

      if (this._timeRemaining <= 0) {
        this._timeRemaining = 0;
        this._stopTimer();
        showToast('Waktu habis! Jawaban akan dikumpulkan secara otomatis.', 'error');
        setTimeout(() => this._doSubmit(), 1000);
      }
    }, 1000);
  },

  _stopTimer() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  },

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
};
