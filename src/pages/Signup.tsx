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

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Грешка", description: "Паролите не съвпадат", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Грешка", description: "Паролата трябва да е поне 6 символа", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ token: string; user: { id: string; email: string } }>(`/auth/signup`, { email, password });
      localStorage.setItem('token', res.token);
      toast({ title: "Успешно!", description: "Вашият акаунт беше създаден." });
      navigate("/chat");
    } catch (error: any) {
      toast({ title: "Неуспешна регистрация", description: userError(error, 'Неуспешна регистрация. Опитайте отново.'), variant: "destructive" });
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
          <CardTitle className="text-2xl font-bold text-center">Присъединете се към Justic<span className="text-primary">IA</span></CardTitle>
          <CardDescription className="text-center">Създайте акаунт, за да започнете</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Имейл</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Парола</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Потвърдете паролата</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Създаване на акаунт...</>) : ("Създай акаунт")}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Вече имате акаунт?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">Вход</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      </div>
    </div>
  );
}
