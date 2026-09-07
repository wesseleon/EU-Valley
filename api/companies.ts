import type { VercelRequest, VercelResponse } from '@vercel/node';
import { list, put } from '@vercel/blob';
import { hasValidAdminSession, isSameOriginRequest } from './_auth.js';

const BLOB_FILENAME = 'companies.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: 'Storage not configured' });
  }

  try {
    if (req.method === 'GET') {
      // Get companies from blob storage
      const { blobs } = await list({ prefix: BLOB_FILENAME, limit: 1 });
      const companiesBlob = blobs.find(b => b.pathname === BLOB_FILENAME);
      
      if (!companiesBlob) {
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        return res.status(200).json({ companies: [], hiddenIds: [], lastUpdated: null, version: null });
      }

      // Bypass the blob CDN cache so edits are visible immediately.
      const response = await fetch(`${companiesBlob.url}?t=${Date.now()}`, { cache: 'no-store' });
      const data = await response.json();
      
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      return res.status(200).json({ ...data, version: companiesBlob.uploadedAt.toISOString() });
    }

    if (req.method === 'POST') {
      if (!isSameOriginRequest(req) || !hasValidAdminSession(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { companies, hiddenIds } = req.body;
      
      if (
        !Array.isArray(companies) ||
        companies.length > 5000 ||
        !companies.every((company) =>
          company &&
          typeof company.id === 'string' && company.id.length <= 160 &&
          typeof company.name === 'string' && company.name.length <= 200 &&
          Number.isFinite(company.latitude) && Number.isFinite(company.longitude)
        ) ||
        !Array.isArray(hiddenIds) ||
        !hiddenIds.every((id) => typeof id === 'string')
      ) {
        return res.status(400).json({ error: 'Invalid company data' });
      }

      const data = {
        companies,
        hiddenIds,
        lastUpdated: new Date().toISOString(),
      };

      const result = await put(BLOB_FILENAME, JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });

      return res.status(200).json({ success: true, lastUpdated: data.lastUpdated });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Blob storage error:', error);
    return res.status(500).json({ error: 'Failed to access storage' });
  }
}
