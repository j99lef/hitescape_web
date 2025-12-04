import React, { useEffect, useState } from 'react';

export default function Debug() {
  const [info, setInfo] = useState({
    url: '',
    tokenPresent: false,
    sitePasswordPresent: false,
    sessionAuth: '',
    userAgent: '',
    time: '',
  });

  useEffect(() => {
    const tokenPresent = Boolean(import.meta.env.VITE_DEV_ID_TOKEN);
    const sitePasswordPresent = Boolean(import.meta.env.VITE_SITE_PASSWORD);
    const sessionAuth = typeof window !== 'undefined' ? (sessionStorage.getItem('auth') || '') : '';
    setInfo({
      url: typeof window !== 'undefined' ? window.location.href : '',
      tokenPresent,
      sitePasswordPresent,
      sessionAuth,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      time: new Date().toISOString(),
    });
  }, []);

  return (
    <div className="container">
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Debug</h2>
        <pre className="result">
{JSON.stringify(info, null, 2)}
        </pre>
      </div>
    </div>
  );
}


