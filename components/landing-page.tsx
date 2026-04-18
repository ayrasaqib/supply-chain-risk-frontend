"use client"

import Link from "next/link"
import { ArrowRight, Globe, Shield, TrendingUp, Zap, MapPin, BarChart3 } from "lucide-react"
import { AppLogo } from "@/components/app-logo"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Globe,
    title: "Global Hub Monitoring",
    description: "Track risk factors across major ports, airports, and distribution centers worldwide in real-time.",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Comprehensive risk scoring based on weather and geopolitical events.",
  },
  {
    icon: TrendingUp,
    title: "Predictive Analytics",
    description: "AI-powered predictions to anticipate disruptions before they impact your supply chain.",
  },
  {
    icon: Zap,
    title: "Real-time Alerts",
    description: "Instant notifications when risk levels change at any the locations you subscribe to.",
  },
  {
    icon: MapPin,
    title: "Custom Locations",
    description: "Analyze risk factors for any coordinates worldwide with our dynamic hub analysis.",
  },
  {
    icon: BarChart3,
    title: "Detailed Reports",
    description: "Generate comprehensive risk reports with actionable insights for your operations.",
  },
]

const stats = [
  { value: "50+", label: "Global Hubs", sublabel: "Monitored" },
  { value: "99.9%", label: "Uptime", sublabel: "Reliability" },
  { value: "15+", label: "Risk Factors", sublabel: "Analyzed" },
  { value: "24/7", label: "Monitoring", sublabel: "Availability" },
]

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo />
            <span className="font-semibold tracking-tight">IntelliSupply</span>
          </Link>
          
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link href="#stats" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Platform
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Real-time Supply Chain
              <br />
              <span className="text-muted-foreground">Risk Intelligence</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
              Monitor, analyze, and mitigate risks across your global supply chain network. 
              Get actionable insights powered by real-time data and predictive analytics.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start Monitoring
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  View Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="border-b border-border/40 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                  <span className="block text-xs">{stat.sublabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to manage supply chain risk
            </h2>
            <p className="mt-4 text-muted-foreground">
              Comprehensive tools and insights to keep your operations running smoothly.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-xl border border-border/50 bg-card p-6 transition-colors hover:border-border hover:bg-accent/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40 bg-accent/30 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to secure your supply chain?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join leading logistics companies using our platform to monitor and mitigate supply chain risks.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <AppLogo className="h-6 w-6 rounded" />
            <span className="text-sm font-medium">IntelliSupply</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Real-time supply chain risk intelligence platform.
          </p>
        </div>
      </footer>
    </div>
  )
}
