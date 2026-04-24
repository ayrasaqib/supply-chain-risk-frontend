"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { confirmSignUp } from "aws-amplify/auth";

import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavBar } from "@/components/ui/navbar";
import { BackgroundMap } from "@/components/ui/background-map";

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await confirmSignUp({
        username: email,
        confirmationCode: code,
      });

      router.push(returnTo);
    } catch (err: any) {
      setError(err.message || "Confirmation failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[oklch(15.167%_0.05942_261.972)]">
      <BackgroundMap />
      <div className="absolute inset-0 z-10 bg-slate-950/60" />

      <div className="relative z-20 flex min-h-screen flex-col">
        <NavBar variant="auth" />

        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-sm">
            {/* GLASS CARD */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Confirm your email
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  We sent a verification code to{" "}
                  <span className="text-white">{email}</span>
                </p>
              </div>

              <form onSubmit={handleConfirm} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-slate-200">
                    Verification code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    "Confirm account"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-300">
                Didn’t receive the code?{" "}
                <button
                  className="font-medium text-white hover:underline"
                  onClick={() => window.location.reload()}
                >
                  Resend
                </button>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
