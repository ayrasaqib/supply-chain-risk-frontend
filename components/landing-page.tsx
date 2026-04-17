"use client";

import Link from "next/link";
import {
  ArrowRight,
  Globe,
  Shield,
  TrendingUp,
  Zap,
  Route,
  MapPin,
  BarChart3,
  Bot,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { demoHubs, SupplyChainMap } from "./demo-map";
import { scrollToSection } from "./ui/scroll";
import { useReveal } from "@/hooks/use-reveal";
import { NavBar } from "./ui/navbar";

const features = [
  {
    icon: Globe,
    title: "Global Hub Monitoring",
    description:
      "Track risk factors across major ports, airports, and distribution centers worldwide in real-time.",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description:
      "Comprehensive risk scoring based on weather, geopolitical stability, infrastructure, and more.",
  },
  {
    icon: Bot,
    title: "AI Model Analytics",
    description:
      "AI-powered evaluation model to anticipate disruptions before they impact your supply chain.",
  },
  {
    icon: Zap,
    title: "Real-time Alerts",
    description:
      "Instant notifications when risk levels change at any of your monitored locations.",
  },
  {
    icon: MapPin,
    title: "Custom Locations",
    description:
      "Analyze risk factors for any coordinates worldwide with our dynamic hub analysis.",
  },
  {
    icon: Route,
    title: "Optimal Route",
    description:
      "Specialised algorithm designed to find routes with optimal risk scores",
  },
];

const stats = [
  { value: "50+", label: "Global Hubs", sublabel: "Monitored" },
  { value: "99.9%", label: "Uptime", sublabel: "Reliability" },
  { value: "15+", label: "Risk Factors", sublabel: "Analyzed" },
  { value: "24/7", label: "Monitoring", sublabel: "Coverage" },
];

export function LandingPage() {
  useReveal();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* HEADER */}
      <NavBar variant="landing"></NavBar>

      {/* HERO */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="container mx-auto px-4">
          {/* TEXT */}
          <div className="mx-auto max-w-3xl text-center">
            <div className="pointer-events-none absolute inset-0 opacity-[0.9]"></div>
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_30%)]" />
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `
      linear-gradient(to right, rgba(148,163,184,0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(148,163,184,0.06) 1px, transparent 1px)
    `,
                  backgroundSize: "80px 80px",
                }}
              />
              <span className="block text-white">Real-time Supply Chain</span>

              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(59,130,246,0.35)]">
                Risk Intelligence
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Monitor, analyze, and mitigate risks across your global supply
              chain network.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  Start Monitoring
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link href="/login">
                <Button
                  size="lg"
                  className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/60 transition-all"
                >
                  Try Live Map
                </Button>
              </Link>
            </div>
          </div>

          {/* MAP PREVIEW */}
          <div className="reveal delay-200 mt-16 relative">
            {/* tighter glow */}
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="h-[420px] w-[85%] rounded-full bg-primary/20 blur-2xl opacity-60" />
            </div>
            <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur-md">
              Global Risk Network Example
            </div>

            <div className="relative h-[420px] w-full overflow-hidden rounded-[28px]">
              <SupplyChainMap
                hubs={demoHubs}
                selectedHub={null}
                onSelectHub={() => {}}
              />

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.6))]" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section
        id="stats"
        className="reveal delay-400 py-16 bg-card/20 border-y border-border/40"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <div key={i}>
                <div className="text-3xl font-bold">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {s.label}
                  <div className="text-xs">{s.sublabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="reveal delay-200 py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">
              Everything you need to manage supply chain risk
            </h2>
            <p className="mt-4 text-muted-foreground">
              Comprehensive tools and insights to keep your operations running
              smoothly.
            </p>
          </div>

          <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/60 bg-card/70 backdrop-blur p-6 hover:border-primary/40 hover:bg-accent/40 hover:-translate-y-1 transition-all duration-200"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>

                <h3 className="mt-4 font-semibold">{f.title}</h3>

                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section
        id="pricing"
        className="reveal delay-300 py-24 bg-card/20 border-y border-border/40"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Clear, reasonable pricing
          </h2>

          <p className="mt-4 text-muted-foreground">
            Choose the plan that best fits your operations.
          </p>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border/60 bg-card/70 backdrop-blur p-6 hover:shadow-lg transition">
              <h3 className="font-semibold">Starter</h3>
              <p className="text-3xl font-bold mt-2">$0</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Track up to 5 ports</li>
                <li>• Basic risk insights</li>
              </ul>
              <Button className="mt-6 w-full" variant="outline">
                Get Started
              </Button>
            </div>

            <div className="relative rounded-xl border border-primary/40 bg-primary/10 p-6 scale-105 shadow-xl shadow-primary/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="font-semibold">Pro</h3>
              <p className="text-3xl font-bold mt-2">$49/mo</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Unlimited ports</li>
                <li>• Route optimization</li>
                <li>• Real-time alerts</li>
              </ul>
              <Button className="mt-6 w-full">Upgrade</Button>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/70 backdrop-blur p-6 hover:shadow-lg transition">
              <h3 className="font-semibold">Enterprise</h3>
              <p className="text-3xl font-bold mt-2">Custom</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Team collaboration</li>
                <li>• API access</li>
              </ul>
              <Button className="mt-6 w-full" variant="outline">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="reveal delay-400 py-24 bg-gradient-to-b from-background to-card/30 border-t border-border/40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2),transparent_70%)]" />

        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to secure your supply chain?
          </h2>

          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            Join leading logistics companies using our platform to monitor and
            mitigate supply chain risks.
          </p>

          <div className="mt-8">
            <Link href="/register">
              <Button
                size="lg"
                className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
              >
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <AppLogo className="h-6 w-6" />
            <span className="text-sm font-medium">IntelliSupply</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time supply chain risk intelligence platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
