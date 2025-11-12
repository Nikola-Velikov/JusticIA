import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { apiPost, userError } from "@/lib/api";
import { Header } from "@/components/Header";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiPost<{ token: string; user: { id: string; email: string } }>(`/auth/login`, { email, password });
      localStorage.setItem('token', res.token);
      toast({ title: "Успешно!", description: "Вие влязохте успешно." });
      try { sessionStorage.setItem('newChatOnNextVisit','1'); localStorage.removeItem('lastChatId'); } catch {} navigate("/chat");
    } catch (error: any) {
      toast({ title: "Неуспешен вход", description: userError(error, 'Невалиден имейл или парола'), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex flex-col">
      <Header showSidebarTrigger={false} showSourcesToggle={false} />
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Добре дошли в Justic<span className="text-primary">IA</span>
          </CardTitle>
          <CardDescription className="text-center">
            Влезте, за да получите достъп до вашия правен асистент
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Имейл</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Парола</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Влизане...</>) : ("Вход")}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Нямате акаунт?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">Регистрация</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
}

