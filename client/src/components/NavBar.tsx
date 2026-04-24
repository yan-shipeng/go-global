import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Trophy, History, GitCompare, Gamepad2, LogOut, LogIn } from "lucide-react";

const navItems = [
  { href: "/game", label: "开始游戏", icon: Gamepad2 },
  { href: "/leaderboard", label: "排行榜", icon: Trophy },
  { href: "/compare", label: "决策对比", icon: GitCompare },
  { href: "/history", label: "我的记录", icon: History },
];

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 no-underline">
          <span className="text-primary font-bold text-lg tracking-tight">出海变革</span>
          <span className="text-muted-foreground text-xs hidden sm:block">· 多人模拟</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant={location === href ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5 text-sm"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                {user?.name ?? "玩家"}
              </span>
              <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-1.5">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:block">退出</span>
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="gap-1.5 bg-primary hover:bg-primary/90"
              onClick={() => window.location.href = getLoginUrl()}
            >
              <LogIn className="w-3.5 h-3.5" />
              登录
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden border-t border-border">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex-1">
            <button
              className={`w-full flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                location === href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          </Link>
        ))}
      </div>
    </header>
  );
}
