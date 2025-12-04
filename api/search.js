// Serverless function on Vercel to proxy browser requests to Cloud Run.
// Avoids CORS and unauthenticated browser-to-Cloud Run calls.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const cloudRunUrl = process.env.CLOUD_RUN_URL;
    const identityToken = process.env.IDENTITY_TOKEN;
    if (!cloudRunUrl || !identityToken) {
      return res.status(500).json({
        error: 'Server configuration error',
        details: {
          CLOUD_RUN_URL: Boolean(cloudRunUrl),
          IDENTITY_TOKEN: Boolean(identityToken),
        },
      });
    }
    // Parse body (Vercel Node functions provide parsed JSON only if content-type is application/json)
    const { origin, destination, departDate, returnDate } = req.body || {};
    const upstream = await fetch(`${cloudRunUrl.replace(/\/+$/, '')}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${identityToken}`,
      },
      body: JSON.stringify({ origin, destination, departDate, returnDate }),
    });
    const text = await upstream.text();
    // Pass through status; try to return JSON if possible
    try {
      const data = JSON.parse(text);
      return res.status(upstream.status).json(data);
    } catch {
      return res.status(upstream.status).send(text);
    }
  } catch (err) {
    return res.status(500).json({
      error: 'Proxy request failed',
      message: err?.message || String(err),
    });
  }
}


