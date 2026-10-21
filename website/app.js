// Waitlist: posts to the Cloudflare Pages Function at /api/waitlist.
// Until a KV namespace is bound, the function answers 503 and we say so honestly.
document.querySelectorAll('[data-waitlist]').forEach((form) => {
  const note = form.querySelector('.form-note');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = new FormData(form).get('email');
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        note.textContent = 'You’re on the list. We’ll be in touch.';
        form.reset();
      } else if (res.status === 400) {
        note.textContent = 'That email doesn’t look right — try again?';
      } else {
        note.textContent = 'The waitlist isn’t open yet. Check back soon.';
      }
    } catch {
      note.textContent = 'Couldn’t reach the server. Try again in a moment.';
    } finally {
      button.disabled = false;
    }
  });
});
