"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Globe,
  Shield,
  TrendingUp,
  Zap,
  Route,
  MapPin,
  Bot,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { demoHubs, SupplyChainMap } from "./demo-map";
import { scrollToSection } from "./ui/scroll";
import { useReveal } from "@/hooks/use-reveal";

const features = [
  {
    icon: Globe,
    title: "Global Hub Monitoring",
    description:
      "Track risk across 1K+ major ports, airports, and distribution centers worldwide in real-time.",
  },
  {
    icon: BarChart3,
    title: "Data-Driven Insights",
    description:
      "Risk scoring is powered by comprehensive weather and geopolitical event data.",
  },
  {
    icon: Bot,
    title: "Machine Learning Risk Analytics",
    description:
      "Machine learning model powers predictive insight on potential disruption up to 7 days in advance.",
  },
  {
    icon: Zap,
    title: "Real-time Alerts",
    description:
      "Instant notifications when risk levels change at any of the locations you subscribe to.",
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
      "Specialised algorithm designed to find route to a destination balancing optimal distance and risk scores",
  },
];

const stats = [
  { value: "50+", label: "Global Hubs", sublabel: "Monitored" },
  { value: "99.9%", label: "Uptime", sublabel: "Reliability" },
  { value: "15+", label: "Risk Factors", sublabel: "Analyzed" },
  { value: "24/7", label: "Monitoring", sublabel: "Availability" },
];

const navItems = [
  { id: "stats", label: "Platform" },
  { id: "features", label: "Features" },
  { id: "pricing", label: "Pricing" },
] as const;

export function LandingPage() {
  const [activeSection, setActiveSection] =
    useState<(typeof navItems)[number]["id"]>("stats");

  useReveal();

  useEffect(() => {
    const sections = navItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => section !== null);

    if (!sections.length) {
      return;
    }

    const updateActiveSection = () => {
      const triggerLine = 140;
      let currentSection = sections[0].id as (typeof navItems)[number]["id"];

      for (const section of sections) {
        const { top } = section.getBoundingClientRect();

        if (top <= triggerLine) {
          currentSection = section.id as (typeof navItems)[number]["id"];
        } else {
          break;
        }
      }

      setActiveSection(currentSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo />
            <span className="font-semibold tracking-tight">IntelliSupply</span>
          </Link>
          <nav className="hidden md:flex items-center gap-3">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`rounded-full px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

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
            </div>
          </div>

          {/* MAP PREVIEW */}
          <div className="reveal delay-200 mt-16 relative">
            <div className="absolute inset-0 -z-10 flex items-center justify-center">
              <div className="h-[460px] w-[88%] rounded-full bg-primary/20 blur-3xl opacity-60" />
            </div>

            <div className="overflow-hidden rounded-[28px] border border-border/60 bg-card/70 shadow-2xl shadow-black/25 backdrop-blur-xl">
              <div className="border-b border-border/60 bg-background/85 backdrop-blur-sm">
                <div className="flex flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground md:text-base">
                        Supply Chain Risk Monitor
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Monitoring 1K+ global supply chain hubs
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                      18 Low
                    </div>
                    <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                      14 Elevated
                    </div>
                    <div className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-300">
                      11 High
                    </div>
                    <div className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300">
                      7 Critical
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2 text-xs text-muted-foreground md:px-5">
                  <span>Avg Risk 47</span>
                  <span>Updated moments ago</span>
                </div>
              </div>

              <div className="relative h-[420px] w-full overflow-hidden bg-slate-950">
                <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur-md">
                  <div className="text-[11px] font-medium text-slate-100">
                    Global view
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">
                    Top-risk hubs and clusters
                  </div>
                </div>

                <SupplyChainMap
                  hubs={demoHubs}
                  selectedHub={null}
                  selectedRegion={null}
                  onSelectHub={() => {}}
                />

                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(2,6,23,0.72))]" />
              </div>
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
              Everything you need to proactively manage supply chain risk
            </h2>
            <p className="mt-4 text-muted-foreground">
              Comprehensive tools and insights to keep your operations running
              smoothly.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {/* STARTER */}
            <div className="rounded-xl border border-border/60 bg-card/70 backdrop-blur p-6 hover:shadow-lg transition">
              <h3 className="font-semibold">STARTER</h3>
              <p className="text-3xl font-bold mt-2">$299</p>
              <p className="text-sm text-muted-foreground">/month</p>
              <p className="mt-3 text-sm text-muted-foreground">
                For smaller logistics firms needing essential risk visibility
              </p>

              <button className="mt-4 w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition">
                Get Started
              </button>

              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Up to 20 monitored hubs</li>
                <li>• 7-day risk forecasts</li>
                <li>• Dashboard & map access</li>
                <li>• Email risk notifications</li>
                <li>• Regional map filtering</li>
                <li>• Basic risk reporting</li>
              </ul>
            </div>

            {/* PROFESSIONAL */}
            <div className="relative rounded-xl border border-primary/40 bg-primary/10 p-6 scale-105 shadow-xl shadow-primary/10">
              <h3 className="font-semibold">PROFESSIONAL</h3>
              <p className="text-3xl font-bold mt-2">$799</p>
              <p className="text-sm text-muted-foreground">/month</p>

              <p className="mt-3 text-sm text-muted-foreground">
                For mid-size enterprises requiring full risk coverage
              </p>

              <button className="mt-4 w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition">
                Get Started
              </button>

              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Up to 200 monitored hubs</li>
                <li>• 7-day risk forecasts</li>
                <li>• Custom location analysis</li>
                <li>• Optimal path routing</li>
                <li>• Hub watchlist & alerts</li>
                <li>• Advanced analytics</li>
                <li>• Priority support</li>
              </ul>
            </div>

            {/* ENTERPRISE */}
            <div className="relative rounded-xl border border-border/60 bg-card/70 backdrop-blur p-6 hover:shadow-lg transition">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs bg-primary text-primary-foreground px-3 py-1 rounded-full">
                PRIMARY TARGET
              </div>

              <h3 className="font-semibold mt-4">ENTERPRISE</h3>
              <p className="text-3xl font-bold mt-2">Custom</p>

              <p className="mt-3 text-sm text-muted-foreground">
                For large multinationals with complex, geographically
                distributed supply chains
              </p>

              <button className="mt-4 w-full rounded-md border border-border bg-transparent py-2 text-sm font-medium hover:bg-muted transition">
                Contact Sales
              </button>

              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• 1,800+ global hubs</li>
                <li>• Full platform access</li>
                <li>• API integration (ERP, TMS)</li>
                <li>• Bulk hub monitoring</li>
                <li>• Unlimited watchlist alerts</li>
                <li>• Dedicated support & SLA</li>
                <li>• Custom data pipelines</li>
                <li>• Organisational features</li>
              </ul>
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
