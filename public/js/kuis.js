const Kuis = {
  _answers: {},
  _submitted: {},

  render(container, quizIds) {
    const quizzes = quizIds.map(id => Konten.quizzes[id]).filter(Boolean);
    if (!quizzes.length) {
      container.innerHTML = '<p class="text-muted">Tidak ada kuis untuk modul ini.</p>';
      return;
    }

    this._answers = {};
    this._submitted = {};
    let html = '<div class="quiz-section"><h3>Kuis Pemahaman</h3>';

    quizzes.forEach((q, i) => {
      html += `
        <div class="quiz-card" id="quiz-${q.id}">
          <div class="quiz-number">Soal ${i + 1}</div>
          <p class="quiz-question">${q.question}</p>
          <div class="quiz-options" id="options-${q.id}">
            ${q.options.map((opt, oi) => `
              <div class="quiz-option" data-quiz="${q.id}" data-index="${oi}" onclick="Kuis.select(${q.id}, ${oi})">
                <span class="quiz-radio"></span>
                <span>${opt}</span>
              </div>
            `).join('')}
          </div>
          <div class="quiz-feedback hidden" id="feedback-${q.id}"></div>
        </div>`;
    });

    html += `<button class="btn btn-primary" onclick="Kuis.submit(${JSON.stringify(quizIds)})">Kumpulkan Jawaban</button>`;
    html += `<div class="quiz-score hidden" id="quizScore"></div>`;
    html += `</div>`;
    container.innerHTML = html;
  },

  select(quizId, index) {
    this._answers[quizId] = index;
    document.querySelectorAll(`#options-${quizId} .quiz-option`).forEach(el => {
      el.classList.toggle('selected', parseInt(el.dataset.index) === index);
    });
  },

  submit(quizIds) {
    let correct = 0;
    const total = quizIds.length;

    quizIds.forEach(qId => {
      const q = Konten.quizzes[qId];
      const chosen = this._answers[qId];
      const feedback = document.getElementById(`feedback-${qId}`);
      const options = document.querySelectorAll(`#options-${qId} .quiz-option`);

      options.forEach((el, i) => {
        el.style.pointerEvents = 'none';
        if (i === q.correct) el.classList.add('correct');
        else if (i === chosen && i !== q.correct) el.classList.add('wrong');
      });

      if (chosen === q.correct) {
        correct++;
        feedback.innerHTML = `<span class="quiz-feedback-icon">✅</span> ${q.feedback}`;
      } else if (chosen !== undefined) {
        feedback.innerHTML = `<span class="quiz-feedback-icon">❌</span> ${q.feedback}`;
      } else {
        feedback.innerHTML = `<span class="quiz-feedback-icon">⚠️</span> Jawaban benar: ${q.options[q.correct]}. ${q.feedback}`;
      }
      feedback.classList.remove('hidden');
    });

    const score = Math.round((correct / total) * 100);
    const scoreEl = document.getElementById('quizScore');
    scoreEl.innerHTML = `<div class="score-display">Skor: <strong>${score}%</strong> (${correct}/${total})</div>`;
    scoreEl.classList.remove('hidden');

    const chId = Router.currentChapter;
    if (chId) Progress.setQuizScore(chId, score);
  }
};
