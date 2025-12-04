// Serverless function on Vercel to proxy browser requests to Cloud Run.
// Uses Vercel-provided OIDC -> Google STS (Workload Identity Federation) -> IAM Credentials generateIdToken.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not allowed' });
  }
  try {
    const brokerUrl = process.env.BACKEND_BROKER_URL;
    const cloudRunUrl = process.env.BACKEND_URL || process.env.CLOUD_RUN_URL;
    if (!brokerUrl || !cloudRunUrl) {
      return res.status(500).json({ error: true, message: 'Missing BACKEND_BROKER_URL or BACKEND_URL' });
    }
    // 1) Get ID token from broker
    const tokenResp = await fetch(`${brokerUrl.replace(/\/+$/, '')}/token`, { method: 'POST' });
    const tokenJson = await tokenResp.json().catch(() => ({}));
    if (!tokenResp.ok || !tokenJson.token) {
      return res.status(tokenResp.status || 500).json({ error: true, step: 'broker', details: tokenJson });
    }
    const idToken = tokenJson.token;
    // 2) Call backend Cloud Run
    const upstream = await fetch(`${cloudRunUrl.replace(/\/+$/, '')}/search`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });
    const text = await upstream.text();
    try {
      const data = JSON.parse(text);
      return res.status(upstream.status).json(data);
    } catch {
      return res.status(upstream.status).send(text);
    }
  } catch (err) {
    console.error('Federated proxy failed:', err);
    return res.status(500).json({ error: true, message: err?.message || String(err) });
  }
}


