import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Parse req.body if it's JSON (Vercel auto-parses)
  const { username, password } = req.body;

  console.log("Login attempt received for username:", username);

  // Match against Vercel environment variables: ADMIN_USERNAME and ADMIN_PASSWORD
  const validUsername = process.env.ADMIN_USERNAME || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD;

  if (
    username && 
    password && 
    username === validUsername && 
    password === validPassword
  ) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Incorrect username or password' 
  });
}
