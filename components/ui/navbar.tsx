"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { scrollToSection } from "./scroll";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { User, MapPin, Route, LogOut } from "lucide-react";

type Action = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export function NavBar({
  variant = "default",
  actions = [],
}: {
  variant?: "landing" | "auth" | "default";
  actions?: Action[];
}) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const branding = (
    <>
      <AppLogo className="h-9 w-9" />
      <span className="font-semibold tracking-tight">IntelliSupply</span>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      {/* gradient effects */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 md:px-6">
        {/* LEFT */}
        {variant === "auth" ? (
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {branding}
          </Link>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            {branding}
          </div>
        )}

        {/* CENTER (landing only) */}
        {variant === "landing" && (
          <nav className="hidden flex-1 items-center justify-center gap-2 md:flex">
            <button
              onClick={() => scrollToSection("stats")}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection("features")}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("pricing")}
              className="inline-flex h-10 items-center rounded-full px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </button>
          </nav>
        )}

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-2">
          {!user ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-10 px-4">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="h-10 px-4">Get Started</Button>
              </Link>
            </>
          ) : (
            <>
              {/* DYNAMIC ACTION BUTTONS */}
              {actions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 gap-2 px-4"
                  >
                    {action.icon}
                    <span className="hidden sm:inline">{action.label}</span>
                  </Button>
                </Link>
              ))}

              {/* AVATAR DROPDOWN */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex h-10 items-center gap-2 rounded-full px-2 hover:bg-accent"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                    {user.name?.[0] ?? "U"}
                  </div>
                  <ChevronDown size={16} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg p-2">
                    {/* PROFILE */}
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                    >
                      <User className="h-4 w-4 text-muted-foreground" />
                      Profile
                    </Link>
                    <div className="my-2 h-px bg-border" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
