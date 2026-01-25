import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Vercel automatically parses req.body if it's JSON
  const { password } = req.body;

  // 2. Log the comparison (You can see this in Vercel 'Logs' tab)
  console.log("Login attempt received");

  // 3. Match against your specific Vercel Variable: ADMIN_PASSWORD
  if (password && password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Incorrect password' 
  });
}
