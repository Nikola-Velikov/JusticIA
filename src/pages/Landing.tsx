import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, BookOpen, Shield, Zap, CheckCircle, ArrowRight, Quote, Star, Bot, CreditCard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Header } from "@/components/Header";

const Landing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState<boolean>(!!localStorage.getItem('token'));
  const [user, setUser] = useState<{ name: string; email: string } | undefined>(undefined);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    (async () => {
      try {
        const me = await apiGet<{ user: { id: string; email: string } }>(`/auth/me`);
        setLoggedIn(true);
        setUser({ name: me.user.email.split('@')[0], email: me.user.email });
      } catch {
        setLoggedIn(false);
        setUser(undefined);
      }
    })();
  }, []);

  // Smooth-scroll to hash sections on load and when hash changes
  useEffect(() => {
    const hash = location.hash?.replace('#', '');
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const goToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        showSidebarTrigger={false}
        showSourcesToggle={false}
        user={user}
        onLogout={loggedIn ? () => { localStorage.removeItem('token'); setLoggedIn(false); setUser(undefined); navigate('/'); } : undefined}
      />

      {/* Hero */}
      <section id="hero" className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block p-3 bg-primary/10 rounded-2xl mb-4">
            <Scale className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
            Вашият AI асистент за<br />
            <span className="text-primary">българското законодателство</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Получете незабавни отговори на вашите правни въпроси с помощта на изкуствен асистент, 
            обучен върху цялото българско законодателство.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => loggedIn ? navigate('/chat') : navigate("/signup")}
              className="bg-primary hover:bg-primary-hover text-lg px-8 py-6"
            >
              {loggedIn ? 'Продължете към чата' : 'Започнете безплатно'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => goToSection('features')}
              className="text-lg px-8 py-6"
            >
              Научете повече
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Защо да изберете JusticIA?
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Модерна платформа, която прави правната информация достъпна за всички
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Моментални отговори</CardTitle>
              <CardDescription>
                Получете точни отговори на вашите правни въпроси за секунди, базирани на 
                актуалното българско законодателство.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Пълна база от източници</CardTitle>
              <CardDescription>
                Достъп до Конституцията, Гражданския кодекс, Наказателния кодекс и всички 
                други нормативни актове.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Сигурност и поверителност</CardTitle>
              <CardDescription>
                Вашите данни са защитени с най-модерните технологии за сигурност и 
                криптиране на информацията.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Как работи?
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Три прости стъпки до правната информация, която ви трябва
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto">
                1
              </div>
              <h4 className="text-xl font-semibold">Задайте въпрос</h4>
              <p className="text-muted-foreground">
                Напишете вашия правен въпрос на естествен език, без да се притеснявате 
                за специфична терминология.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto">
                2
              </div>
              <h4 className="text-xl font-semibold">Анализ на законите</h4>
              <p className="text-muted-foreground">
                AI асистентът анализира хиляди законодателни текстове и намира най-релевантната 
                информация за вашия случай.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto">
                3
              </div>
              <h4 className="text-xl font-semibold">Получете отговор</h4>
              <p className="text-muted-foreground">
                Получете ясен и разбираем отговор с конкретни цитати от законите и 
                препратки към източниците.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground">
              Предимства за всички
            </h3>
            <p className="text-lg text-muted-foreground">
              JusticIA е създадена да помага на граждани, студенти, юристи и бизнеси 
              да намират бързо нужната им правна информация.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">За граждани</h4>
                  <p className="text-muted-foreground">
                    Разберете вашите права и задължения без да се налага да четете 
                    сложни правни текстове.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">За студенти</h4>
                  <p className="text-muted-foreground">
                    Намерете бързо конкретни закони и разпоредби за вашето правно образование.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">За професионалисти</h4>
                  <p className="text-muted-foreground">
                    Спестете време при търсене на правна информация и концентрирайте се 
                    върху казусите.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl p-8 border-2 border-primary/20">
              <Card className="shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    JusticIA
                  </CardTitle>
                  <CardDescription>AI Юридически Асистент</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Какво гласи чл. 5 от Конституцията?</p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <p className="text-sm">
                      Според чл. 5 от Конституцията на България, Конституцията е върховен закон 
                      и другите закони не могат да и противоречат...
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

     

      {/* Pricing */}
      <section id="pricing" className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Планове</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Абонаментите са в подготовка — очаквайте скоро.</p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <Card className="border-2 hover:border-primary/70 transition-colors rounded-2xl shadow-sm hover:shadow-md">
              <CardHeader>
                <CardTitle>Безплатен</CardTitle>
                <CardDescription>За първи стъпки</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Основни запитвания</p>
                  <p>• Ограничени отговори</p>
                </div>
                <Button disabled className="w-full h-10 rounded-full border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 disabled:opacity-100 cursor-not-allowed flex items-center justify-center gap-2 font-medium transition">
                  <CreditCard className="h-4 w-4" />
                  Очаквайте скоро
                </Button>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary hover:border-primary transition-colors rounded-2xl shadow-sm hover:shadow-md relative">
              <div className="absolute -top-3 right-4 text-xs px-2 py-1 rounded-full bg-primary text-primary-foreground shadow">Препоръчан</div>
              <CardHeader>
                <CardTitle>Професионален</CardTitle>
                <CardDescription>За професионална употреба</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• Неограничени запитвания</p>
                  <p>• Приоритетна поддръжка</p>
                </div>
                <Button disabled className="w-full h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-100 cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md transition">
                  <CreditCard className="h-4 w-4" />
                  Очаквайте скоро
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ removed as requested */}

      {/* CTA */}
      <section id="cta" className="bg-gradient-to-r from-primary to-primary-hover py-20">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Готови ли сте да опитате JusticIA?
          </h3>
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            {loggedIn
              ? 'Вече сте се регистрирали — изпробвайте чат системата и задайте своя въпрос.'
              : 'Регистрирайте се безплатно и получете достъп до вашия AI юридически асистент още днес.'}
          </p>
          <Button 
            size="lg" 
            onClick={() => loggedIn ? navigate('/chat') : navigate("/signup")}
            className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
          >
            {loggedIn ? 'Продължете към чата' : 'Започнете безплатно'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          
          
          <div className="border-t border-border mt-2 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 JusticIA. Всички права запазени.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
