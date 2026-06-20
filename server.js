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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`KACC E-Learning running on http://localhost:${PORT}`);
});
