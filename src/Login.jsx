import React, { useState } from 'react';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    const real = (import.meta.env.VITE_SITE_PASSWORD || '').trim();
    const attempt = password.trim();
    if (!real) {
      setError('Site password not configured. Set VITE_SITE_PASSWORD in .env');
      return;
    }
    if (attempt === real) {
      sessionStorage.setItem('auth', 'ok');
      try {
        // Log outcome and key values for verification
        console.log('login-success', {
          sessionAuth: sessionStorage.getItem('auth'),
          typeOfEnv: typeof import.meta.env.VITE_SITE_PASSWORD,
          real: JSON.stringify(real),
          attempt: JSON.stringify(attempt),
          equal: attempt === real
        });
      } catch {}
      if (typeof onSuccess === 'function') onSuccess();
    } else {
      try {
        console.log('login-fail', {
          sessionAuth: sessionStorage.getItem('auth'),
          typeOfEnv: typeof import.meta.env.VITE_SITE_PASSWORD,
          real: JSON.stringify(real),
          attempt: JSON.stringify(attempt),
          equal: attempt === real
        });
      } catch {}
      setError('Incorrect password.');
    }
  }

  return (
    <>
      <img src="/Esc_blue.png" alt="Hit Escape Now" className="logo" />
      <form className="card" onSubmit={handleSubmit}>
        <h1 className="title" style={{ marginTop: 0, marginBottom: 4 }}>Hit Escape Now</h1>
        <div className="subtitle">Your AI-powered travel concierge</div>
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="button" type="submit">Enter</button>
        {error && <pre className="error">{error}</pre>}
      </form>
    </>
  );
}


