// Serverless function on Vercel to proxy browser requests to Cloud Run.
// Uses Vercel-provided OIDC -> Google STS (Workload Identity Federation) -> IAM Credentials generateIdToken.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not allowed' });
  }
  try {
    const cloudRunUrl = process.env.CLOUD_RUN_URL;
    // Vercel OIDC token (must be provided by Vercel or injected as an env var)
    const vercelOidc = process.env.VERCEL_IDENTITY_TOKEN;
    // WIF details (allow overrides via env)
    const projectNumber = process.env.GCP_PROJECT_NUMBER || '406054563942';
    const workloadPool = process.env.WIF_POOL_ID || 'vercel-pool';
    const providerId = process.env.WIF_PROVIDER_ID || 'vercel-provider';
    const serviceAccountEmail =
      process.env.SA_EMAIL ||
      'hitescape-vercel-invoker@phoenix-479815.iam.gserviceaccount.com';

    if (!cloudRunUrl) {
      return res.status(500).json({ error: true, message: 'Missing CLOUD_RUN_URL' });
    }
    if (!vercelOidc) {
      return res.status(500).json({
        error: true,
        message:
          'Missing VERCEL_IDENTITY_TOKEN. Ensure Vercel OIDC token is available to this function.',
      });
    }

    const stsAudience = `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${workloadPool}/providers/${providerId}`;

    // 1) Exchange Vercel OIDC for Google STS access token
    const stsResp = await fetch('https://sts.googleapis.com/v1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange',
        subject_token_type: 'urn:ietf:params:oauth:token-type:id_token',
        subject_token: vercelOidc,
        audience: stsAudience,
      }),
    });
    const stsBody = await stsResp.json().catch(() => ({}));
    if (!stsResp.ok) {
      return res.status(stsResp.status).json({
        error: true,
        step: 'sts',
        details: stsBody,
      });
    }
    const accessToken = stsBody.access_token;
    if (!accessToken) {
      return res.status(500).json({ error: true, message: 'No access_token from STS' });
    }

    // 2) Use access token to generate an ID token for Cloud Run audience
    const iamUrl = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(
      serviceAccountEmail
    )}:generateIdToken`;
    const idTokenResp = await fetch(iamUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audience: cloudRunUrl,
        includeEmail: true,
      }),
    });
    const idTokenBody = await idTokenResp.json().catch(() => ({}));
    if (!idTokenResp.ok) {
      return res.status(idTokenResp.status).json({
        error: true,
        step: 'generateIdToken',
        details: idTokenBody,
      });
    }
    const idToken = idTokenBody.token;
    if (!idToken) {
      return res.status(500).json({ error: true, message: 'No idToken from IAM Credentials' });
    }

    // 3) Call Cloud Run with the freshly minted ID token
    const upstream = await fetch(`${cloudRunUrl.replace(/\/+$/, '')}/search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
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


