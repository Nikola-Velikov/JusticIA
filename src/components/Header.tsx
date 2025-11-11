import { FileText, Home, BookOpen, LogOut, ListChecks, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

interface HeaderProps {
  onToggleSources?: () => void;
  showSources?: boolean;
  showSourcesToggle?: boolean;
  showSidebarTrigger?: boolean;
  user?: { name: string; email: string };
  onLogout?: () => void;
}

export function Header({ onToggleSources, showSources, showSourcesToggle = false, showSidebarTrigger = false, user, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string>("");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sectionIds = useMemo(() => [
    "features",
    "how-it-works",
    "benefits",
    "testimonials",
    "pricing",
    "cta",
  ], []);

  useEffect(() => {
    if (location.pathname !== "/") return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio - a.intersectionRatio));
      if (visible[0]?.target?.id) {
        setActiveSection(visible[0].target.id);
      }
    }, { root: null, threshold: [0.2, 0.5, 0.8], rootMargin: "-20% 0px -50% 0px" });

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [location.pathname, sectionIds]);

  const goToSection = (id: string) => {
    if (location.pathname === '/') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    navigate(`/#${id}`);
  };

  const navBtnClass = (id?: string) => {
    const active = id && activeSection === id && location.pathname === '/';
    return active ? "bg-primary/10 text-primary gap-2" : "gap-2";
  };

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {showSidebarTrigger && <SidebarTrigger className="h-8 w-8" />}
        <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-foreground">
            Justic<span className="text-primary">IA</span>
          </h1>
        </button>
      </div>

      {/* Center Section - Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Начало
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToSection('features')}
          className={navBtnClass('features')}
        >
          <ListChecks className="h-4 w-4" />
          Функции
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToSection('how-it-works')}
          className={navBtnClass('how-it-works')}
        >
          <FileText className="h-4 w-4" />
          Как работи
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToSection('benefits')}
          className={navBtnClass('benefits')}
        >
          <BookOpen className="h-4 w-4" />
          Предимства
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goToSection('pricing')}
          className={navBtnClass('pricing')}
        >
          <BadgeDollarSign className="h-4 w-4" />
          Планове
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/chat")}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Чат
        </Button>
        {showSourcesToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSources}
            className={showSources ? "bg-primary/10 text-primary gap-2" : "gap-2"}
          >
            <FileText className="h-4 w-4" />
            Източници
          </Button>
        )}
      </nav>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* Mobile Sources Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSources}
          className={`md:hidden ${showSources ? "bg-primary text-primary-foreground" : ""}`}
        >
          <FileText className="h-4 w-4" />
        </Button>

        {/* Simple user info + logout (no dropdown) */}
        {user && onLogout ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Изход
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
              Вход
            </Button>
            <Button size="sm" onClick={() => navigate("/signup")} className="bg-primary hover:bg-primary-hover">
              Регистрация
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
