const Auth = {
  user: null,
  async check() {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        this.user = await res.json();
        return true;
      }
      return false;
    } catch { return false; }
  },
  async logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  }
};
