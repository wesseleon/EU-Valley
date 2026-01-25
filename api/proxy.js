export default async function handler(req, res) {
  const API_KEY = process.env.PROTOMAPS_API_KEY;
  const baseEndpoint = 'https://api.protomaps.com/...'; // No key in URL

  if (req.method === 'POST') {
    try {
      // Append the key to headers or query params securely
      const url = new URL(baseEndpoint);
      url.searchParams.append('key', API_KEY); // Or use headers

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
