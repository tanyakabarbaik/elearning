const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'kacc-session-secret-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 86400000 }
}));

const usersPath = path.join(__dirname, 'data', 'users.json');
const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

const notesPath = path.join(__dirname, 'data', 'notes.json');
if (!fs.existsSync(notesPath)) {
  fs.writeFileSync(notesPath, '{}', 'utf-8');
}

const progressPath = path.join(__dirname, 'data', 'progress.json');
if (!fs.existsSync(progressPath)) {
  fs.writeFileSync(progressPath, '{}', 'utf-8');
}

function auth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Email atau password salah' });
  const match = bcrypt.compareSync(password, user.password);
  if (!match) return res.status(401).json({ error: 'Email atau password salah' });
  req.session.user = { email: user.email, name: user.name };
  res.json({ success: true, name: user.name });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  if (req.session.user) return res.json(req.session.user);
  res.status(401).json({ error: 'Not authenticated' });
});

app.get('/api/notes/:chapterId/:moduleId', auth, (req, res) => {
  const key = `${req.session.user.email}-${req.params.chapterId}-${req.params.moduleId}`;
  const notes = JSON.parse(fs.readFileSync(notesPath, 'utf-8'));
  res.json({ content: notes[key] || '' });
});

app.post('/api/notes', auth, (req, res) => {
  const { chapterId, moduleId, content } = req.body;
  const key = `${req.session.user.email}-${chapterId}-${moduleId}`;
  const notes = JSON.parse(fs.readFileSync(notesPath, 'utf-8'));
  notes[key] = content;
  fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2), 'utf-8');
  res.json({ success: true });
});

app.get('/api/progress', auth, (req, res) => {
  const all = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
  const userPrefix = `${req.session.user.email}-`;
  const userProgress = {};
  for (const key in all) {
    if (key.startsWith(userPrefix)) {
      userProgress[key.slice(userPrefix.length)] = all[key];
    }
  }
  res.json(userProgress);
});

app.post('/api/progress', auth, (req, res) => {
  const { chapterId, completed, quizScore } = req.body;
  const key = `${req.session.user.email}-${chapterId}`;
  const all = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
  all[key] = { completed: completed || [], quizScore: quizScore ?? null };
  fs.writeFileSync(progressPath, JSON.stringify(all, null, 2), 'utf-8');
  res.json({ success: true });
});

app.put('/api/progress', auth, (req, res) => {
  const all = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
  const prefix = `${req.session.user.email}-`;
  for (const key in all) {
    if (key.startsWith(prefix)) delete all[key];
  }
  for (const chId in req.body) {
    all[`${prefix}${chId}`] = req.body[chId];
  }
  fs.writeFileSync(progressPath, JSON.stringify(all, null, 2), 'utf-8');
  res.json({ success: true });
});

app.delete('/api/progress', auth, (req, res) => {
  const all = JSON.parse(fs.readFileSync(progressPath, 'utf-8'));
  const prefix = `${req.session.user.email}-`;
  for (const key in all) {
    if (key.startsWith(prefix)) delete all[key];
  }
  fs.writeFileSync(progressPath, JSON.stringify(all, null, 2), 'utf-8');
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`KACC E-Learning running on http://localhost:${PORT}`);
});
