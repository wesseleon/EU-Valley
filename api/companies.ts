import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list, put } from '@vercel/blob';

const BLOB_FILENAME = 'companies.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get companies from blob storage
      const { blobs } = await list();
      const companiesBlob = blobs.find(b => b.pathname === BLOB_FILENAME);
      
      if (!companiesBlob) {
        return res.status(200).json({ companies: [], hiddenIds: [], lastUpdated: null });
      }

      const response = await fetch(companiesBlob.url);
      const data = await response.json();
      
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { companies, hiddenIds } = req.body;
      
      if (!Array.isArray(companies)) {
        return res.status(400).json({ error: 'Companies must be an array' });
      }

      const data = {
        companies,
        hiddenIds: hiddenIds || [],
        lastUpdated: new Date().toISOString(),
      };

      await put(BLOB_FILENAME, JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
      });

      return res.status(200).json({ success: true, lastUpdated: data.lastUpdated });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Blob storage error:', error);
    return res.status(500).json({ 
      error: 'Failed to access storage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
