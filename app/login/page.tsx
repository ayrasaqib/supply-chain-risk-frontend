"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/ui/navbar";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      router.push("/dashboard");
      return;
    }

    if (result.error === "User not confirmed") {
      router.push(
        `/confirm?email=${encodeURIComponent(email)}&returnTo=/dashboard`,
      );
      return;
    }

    setError(result.error || "Login failed");
    setIsLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(15.167%_0.05942_261.972)]">
      {/*  MAP BACKGROUND */}
      <div className="absolute inset-0 w-full h-full opacity-50 pointer-events-none scale-125">
        <ComposableMap
          className="w-full h-full"
          projection="geoMercator"
          projectionConfig={{
            scale: 140,
            center: [0, 20],
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b"
                  stroke="#334155"
                  strokeWidth={0.6}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>
        </ComposableMap>
      </div>
      <div className="absolute inset-0 z-10 bg-slate-950/60" />
      <div className="relative z-20 flex min-h-screen flex-col">
        {/* HEADER */}
        <NavBar variant="auth"></NavBar>

        {/* MAIN */}
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Welcome back
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Sign in to access your dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-300">
                {"Don't have an account? "}
                <Link
                  href="/register"
                  className="font-medium text-white hover:underline"
                >
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
