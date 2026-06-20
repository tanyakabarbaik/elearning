const Notes = {
  chapterId: null,
  moduleId: null,
  debounceTimer: null,

  render(chapterId, moduleId) {
    this.chapterId = chapterId;
    this.moduleId = moduleId;
    return `
      <div class="notes-panel" id="notesPanel">
        <div class="notes-header">
          <h3>Catatan</h3>
          <span class="notes-status" id="notesStatus">Tersimpan</span>
        </div>
        <div class="notes-toolbar">
          <button onclick="Notes.execCommand('bold')" title="Tebal"><b>B</b></button>
          <button onclick="Notes.execCommand('italic')" title="Miring"><i>I</i></button>
          <button onclick="Notes.execCommand('underline')" title="Garis Bawah"><u>U</u></button>
          <span class="toolbar-sep"></span>
          <button onclick="Notes.execCommand('insertUnorderedList')" title="Daftar">≡</button>
          <button onclick="Notes.execCommand('insertOrderedList')" title="Daftar Nomor">1.</button>
        </div>
        <div class="notes-editor" id="notesEditor" contenteditable="true"></div>
      </div>`;
  },

  init(chapterId, moduleId) {
    this.chapterId = chapterId;
    this.moduleId = moduleId;
    const editor = document.getElementById('notesEditor');
    if (!editor) return;
    this.load();
    editor.addEventListener('input', () => this._onInput());
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this.save();
      }
    });
  },

  async load() {
    const editor = document.getElementById('notesEditor');
    if (!editor) return;
    try {
      const res = await fetch(`/api/notes/${this.chapterId}/${this.moduleId}`);
      if (res.ok) {
        const data = await res.json();
        editor.innerHTML = data.content || '';
      }
    } catch (e) {
      console.error('Gagal memuat catatan');
    }
  },

  async save() {
    const editor = document.getElementById('notesEditor');
    if (!editor || !this.chapterId || !this.moduleId) return;
    const status = document.getElementById('notesStatus');
    try {
      status.textContent = 'Menyimpan...';
      status.className = 'notes-status';
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId: this.chapterId,
          moduleId: this.moduleId,
          content: editor.innerHTML
        })
      });
      if (res.ok) {
        status.textContent = 'Tersimpan';
        status.className = 'notes-status saved';
      } else {
        status.textContent = 'Gagal simpan';
        status.className = 'notes-status';
      }
    } catch (e) {
      status.textContent = 'Gagal simpan';
      status.className = 'notes-status';
    }
  },

  _onInput() {
    const status = document.getElementById('notesStatus');
    status.textContent = 'Belum tersimpan';
    status.className = 'notes-status';
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.save(), 1000);
  },

  execCommand(cmd) {
    document.execCommand(cmd, false, null);
    const editor = document.getElementById('notesEditor');
    if (editor) editor.focus();
    this._onInput();
  }
};