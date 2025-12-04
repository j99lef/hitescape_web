import React, { useEffect, useState } from 'react';
import './styles.css';
import Search from './Search.jsx';
import Login from './Login.jsx';

export default function App() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(sessionStorage.getItem('auth') === 'ok');
  }, []);

  if (!authed) {
    return (
      <div className="container">
        <h1 className="title">HitEscapeNow</h1>
        <Login onSuccess={() => setAuthed(true)} />
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="title">HitEscapeNow</h1>
      <Search />
    </div>
  );
}


