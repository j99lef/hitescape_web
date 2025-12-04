import React, { useState } from 'react';
import { getAuthHeader } from './auth.js';

const API_URL = 'https://hitescape-agent-ws2qitn7ea-nw.a.run.app/search';

export default function Search() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      // Ensure user is authenticated via password gate before any API call
      if (sessionStorage.getItem('auth') !== 'ok') {
        throw new Error('Please log in first to use search.');
      }
      if (import.meta.env.DEV) {
        // Log presence only (not the token value) to verify env injection in dev
        // Remove/ignore in production (guarded by DEV).
        // eslint-disable-next-line no-console
        console.log('VITE_DEV_ID_TOKEN present:', Boolean(import.meta.env.VITE_DEV_ID_TOKEN));
      }
      // Require dev identity token
      const authHeader = getAuthHeader();
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader
        },
        body: JSON.stringify({ origin, destination, departDate, returnDate })
      });
      if (resp.status === 401 || resp.status === 403) {
        const text = await resp.text().catch(() => '');
        throw new Error('Authentication failed. Backend requires a valid identity token.');
      }
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Request failed: ${resp.status} ${resp.statusText} - ${text}`);
      }
      const data = await resp.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSearch}>
      <label className="label">Origin</label>
      <input className="input" value={origin} onChange={e => setOrigin(e.target.value)} placeholder="LHR" />

      <label className="label">Destination</label>
      <input className="input" value={destination} onChange={e => setDestination(e.target.value)} placeholder="JFK" />

      <label className="label">Depart Date</label>
      <input className="input" type="date" value={departDate} onChange={e => setDepartDate(e.target.value)} />

      <label className="label">Return Date</label>
      <input className="input" type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} />

      <button className="button" type="submit" disabled={loading}>
        {loading ? 'Searching…' : 'Search'}
      </button>

      {error && <pre className="error">{error}</pre>}
      {result && (
        <pre className="result">
{JSON.stringify(result, null, 2)}
        </pre>
      )}
      {!import.meta.env.VITE_DEV_ID_TOKEN && (
        <div className="note">
          Set VITE_DEV_ID_TOKEN in .env to call the Cloud Run service.
        </div>
      )}
    </form>
  );
}


