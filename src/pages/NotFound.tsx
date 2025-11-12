import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, MessageSquare, Search } from "lucide-react";
import { apiGet } from "@/lib/api";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isAuthed = !!token;
  const [user, setUser] = useState<{ name: string; email: string } | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthed) { setUser(undefined); return; }
    (async () => {
      try {
        const me = await apiGet<{ user: { id: string; email: string } }>(`/auth/me`);
        setUser({ name: me.user.email.split('@')[0], email: me.user.email });
      } catch {
        setUser(undefined);
      }
    })();
  }, [isAuthed]);

  const handleLogout = () => { try { localStorage.removeItem('token'); } catch {}; navigate('/login'); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col">
      <Header showSidebarTrigger={false} showSourcesToggle={false} user={user} onLogout={isAuthed ? handleLogout : undefined} />
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border border-border bg-card/70 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
                <Search className="h-8 w-8" />
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight">404</h1>
              <p className="text-muted-foreground">
                Страницата, която търсите, не е намерена или е преместена.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button asChild className="gap-2">
                  <Link to="/">
                    <Home className="h-4 w-4" /> Към начало
                  </Link>
                </Button>
                {isAuthed ? (
                  <Button asChild variant="outline" className="gap-2">
                    <Link to="/chat">
                      <MessageSquare className="h-4 w-4" /> Към чата
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="gap-2">
                    <Link to="/signup">
                      <MessageSquare className="h-4 w-4" /> Регистрация
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
