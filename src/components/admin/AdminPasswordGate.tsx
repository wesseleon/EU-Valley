import { createContext, useContext, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PixelIcon } from '@/components/ui/PixelIcon';

const LogoutContext = createContext<(() => Promise<void>) | null>(null);

export const useAdminLogout = () => {
  const logout = useContext(LogoutContext);
  return logout ?? (async () => undefined);
};

export const AdminPasswordGate = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin-session', { credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : { authenticated: false })
      .then((data) => setIsAuthenticated(Boolean(data.authenticated)))
      .catch(() => setIsAuthenticated(false))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin-login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(result?.message || 'Incorrect username or password');
      }
      setIsAuthenticated(true);
      setPassword('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign-in failed. Please try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin-session', { method: 'DELETE', credentials: 'same-origin' }).catch(() => undefined);
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  if (isLoading && !isAuthenticated) {
    return <main className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Loading…</main>;
  }

  if (isAuthenticated) {
    return <LogoutContext.Provider value={handleLogout}>{children}</LogoutContext.Provider>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <PixelIcon name="lock" className="text-2xl text-primary" />
          </div>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>Enter your private credentials to manage companies</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <PixelIcon name="user" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="pl-10" required autoFocus />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <PixelIcon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-10" required />
              </div>
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Access Admin Panel'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
};