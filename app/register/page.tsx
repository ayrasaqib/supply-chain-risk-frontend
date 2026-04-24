"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { BackgroundMap } from "@/components/ui/background-map";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { NavBar } from "@/components/ui/navbar";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user, isLoading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCompanyName =
      companyName.trim() === "" ? "Not Set" : companyName;
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const result = await register(name, email, password, finalCompanyName);

    if (result.success) {
      sessionStorage.setItem("temp_password", password);
      const returnTo = "/dashboard";

      router.push(
        `/confirm?email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`,
      );
    } else {
      setError(result.error || "Registration failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(15.167%_0.05942_261.972)]">
      <BackgroundMap></BackgroundMap>
      <div className="absolute inset-0 z-10 bg-slate-950/60" />
      <div className="relative z-20 flex min-h-screen flex-col">
        <NavBar variant="auth"></NavBar>

        {/* MAIN */}
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            {/* GLASS CARD */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Create an account
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Get started with supply chain risk monitoring
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

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
                  <Label htmlFor="company" className="text-slate-200">
                    Company Name{" "}
                    <span className="text-slate-400">(optional)</span>
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your company (optional)"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
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
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-slate-200">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-300">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-white hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
