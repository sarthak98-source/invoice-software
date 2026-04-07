/**
 * Landing Page — Auth gateway with Login/Register toggle
 * Clean, professional design with branding
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { FileText } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { currentUser } = useStore();
  const navigate = useNavigate();

  /* Redirect to dashboard if already logged in */
  useEffect(() => {
    if (currentUser) {
      navigate({ to: '/dashboard' });
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">BillCraft</h1>
            <p className="text-xs opacity-70">Professional Billing & Invoice Software</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full">
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={() => setMode('register')}
              onLoginSuccess={() => navigate({ to: '/dashboard' })}
            />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Made with <span className="text-destructive">❤</span> by <span className="font-semibold">Shela Gang</span> 🧣
        </p>
      </footer>
    </div>
  );
}
