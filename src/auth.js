export function getAuthHeader() {
  const token = import.meta.env.VITE_DEV_ID_TOKEN;
  if (!token || String(token).trim() === '') {
    throw new Error('Missing VITE_DEV_ID_TOKEN');
  }
  return { Authorization: `Bearer ${token}` };
}


