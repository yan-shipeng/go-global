import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import GamePage from "./pages/GamePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ComparePage from "./pages/ComparePage";
import GameTestPage from "./pages/GameTestPage";

function Router() {
  const [location] = useLocation();
  const isGameRoute = location === "/game" || location === "/game-test";
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className={isGameRoute ? "flex-1 flex flex-col h-screen" : "flex-1"}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/game" component={GamePage} />
          <Route path="/leaderboard" component={LeaderboardPage} />
          <Route path="/compare/:idA/:idB" component={ComparePage} />
          <Route path="/compare" component={LeaderboardPage} />
          <Route path="/game-test" component={GameTestPage} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
