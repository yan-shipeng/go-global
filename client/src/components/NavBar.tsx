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

        {/* Desktop nav links */}
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

        {/* Desktop CTA button */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/game">
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90">
              <Gamepad2 className="w-3.5 h-3.5" />
              开始游戏
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="flex md:hidden border-t border-border bg-card/90">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = location === href || (href === "/game" && location.startsWith("/game"));
          return (
            <Link key={href} href={href} className="flex-1">
              <button
                className={`w-full flex flex-col items-center gap-0.5 pt-2 pb-2.5 text-[11px] font-medium transition-colors relative ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {/* Active top indicator */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full bg-primary" />
                )}
                {/* Icon with pill bg when active */}
                <span
                  className={`flex items-center justify-center w-8 h-6 rounded-full transition-colors ${
                    active ? "bg-primary/15" : ""
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
                {label}
              </button>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
