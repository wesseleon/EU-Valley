export default async function handler(req, res) {
  // Replace with your actual API key (or use environment variables)
  const API_KEY = process.env.API_KEY;
  const endpoint = 'https://api.example.com/data'; // Replace with your API endpoint

  if (req.method === 'POST') {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
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
