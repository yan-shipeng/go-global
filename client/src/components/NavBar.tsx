import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, History, Gamepad2 } from "lucide-react";

const navItems = [
  { href: "/game", label: "开始游戏", icon: Gamepad2 },
  { href: "/leaderboard", label: "排行榜", icon: Trophy },
  { href: "/history", label: "我的记录", icon: History },
];

export default function NavBar() {
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

        {/* CTA button */}
        <div className="flex items-center gap-2">
          <Link href="/game">
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
              <Gamepad2 className="w-3.5 h-3.5" />
              开始游戏
            </Button>
          </Link>
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
