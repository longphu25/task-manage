"use client";

import Link from "next/link";
import LetterGlitch from "@/components/LetterGlitch";
import {
  Database,
  Share2,
  Trophy,
  KeyRound,
  Code2,
  Waves,
  Sparkles,
  Twitter,
  Github,
  Mail,
} from "lucide-react";

const primaryNav = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Tech", href: "#tech" },
  { label: "Contact", href: "#contact" },
];

const featureHighlights = [
  {
    title: "Walrus-Powered Storage",
    description:
      "Persist every task on Walrus so your team can rely on verifiable, tamper-proof state.",
    icon: Database,
  },
  {
    title: "Collaborative Sharing",
    description:
      "Invite contributors instantly and sync updates across wallets without friction.",
    icon: Share2,
  },
  {
    title: "Prize Pools & Rewards",
    description:
      "Stake incentives, track progress, and reward completions directly on-chain.",
    icon: Trophy,
  },
  {
    title: "Passkey-Native Login",
    description:
      "Skip seed phrases with Enoki passkeys for a seamless, secure onboarding flow.",
    icon: KeyRound,
  },
];

const techStack = [
  {
    name: "Walrus",
    description: "Durable object storage for decentralized data availability.",
    icon: Database,
  },
  {
    name: "Move",
    description: "Safe-by-design smart contract language powering our logic.",
    icon: Code2,
  },
  {
    name: "Sui",
    description: "High-throughput L1 delivering real-time UX for task updates.",
    icon: Waves,
  },
  {
    name: "Enoki",
    description:
      "Passkey account abstraction for human-friendly authentication.",
    icon: Sparkles,
  },
];

const contactLinks = [
  {
    label: "Follow on X",
    href: "https://x.com/",
    icon: Twitter,
    handle: "@yourhandle",
  },
  {
    label: "View on GitHub",
    href: "https://github.com/",
    icon: Github,
    handle: "task-manage",
  },
  {
    label: "Email Us",
    href: "mailto:hello@example.com",
    icon: Mail,
    handle: "hello@example.com",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <LetterGlitch
          glitchColors={["#2b4539", "#61dca3", "#61b3dc"]}
          glitchSpeed={50}
          centerVignette={false}
          outerVignette={false}
          smooth
          characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789"
        />
      </div>

      <header className="relative z-10">
        <div className="mx-auto mt-6 w-full max-w-5xl px-4">
          <nav className="relative flex items-center justify-between gap-4 rounded-4xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs uppercase tracking-[0.25em] text-white/70 backdrop-blur-lg shadow-[0_14px_40px_-22px_rgba(10,10,25,0.7)] md:px-6 md:py-3">
            <div className="absolute inset-0 -z-10 rounded-4xl bg-[radial-gradient(circle_at_20%_-20%,rgba(102,214,255,0.28),transparent_55%),radial-gradient(circle_at_85%_120%,rgba(68,255,214,0.22),transparent_55%)]" />

            <Link
              href="#home"
              className="flex items-center gap-2 text-[0.55rem] font-semibold tracking-[0.38em] text-white/80 transition hover:text-white sm:text-[0.6rem]"
            >
              React Bits
            </Link>

            <div className="hidden items-center gap-2 rounded-full bg-black/20 px-2.5 py-1 text-[0.6rem] font-medium tracking-[0.18em] text-white/60 shadow-inner shadow-white/10 backdrop-blur md:flex">
              {primaryNav.map((item) => {
                const isActive = item.href === "#home";
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`rounded-full px-3 py-1 transition ${
                      isActive
                        ? "bg-white text-slate-900 shadow-[0_8px_22px_rgba(255,255,255,0.35)]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-[0.55rem] font-semibold tracking-[0.18em]">
              <Link
                href="#learn"
                className="hidden rounded-full border border-white/15 px-4 py-1.5 text-white/70 backdrop-blur transition hover:border-white/40 hover:text-white sm:inline-flex"
              >
                Learn
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-white px-4 py-1.5 text-slate-900 shadow-[0_8px_20px_rgba(255,255,255,0.3)] transition hover:bg-white/85"
              >
                App
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <section
        id="home"
        className="relative z-10 mx-auto flex min-h-[calc(100vh-120px)] max-w-4xl flex-col items-center justify-center px-6 pb-24 pt-12 text-center md:px-8"
      >
        {/* <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 backdrop-blur-md shadow-lg shadow-black/40">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          New Background
        </div> */}

        <h1 className="mt-8 text-4xl font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.65)] sm:text-5xl md:text-6xl lg:text-7xl">
          Decentralized Task Manager
        </h1>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-white/90"
          >
            Get Started
          </Link>
          {/* <Link
            href="#learn"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white/80 backdrop-blur-md transition hover:border-white/40 hover:text-white"
          >
            Learn More
          </Link> */}
        </div>
      </section>

      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 text-center md:px-8"
      >
        <div className="mx-auto max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
            Features
          </span>
          {/* {/* <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Everything you need to launch missions together
          </h2> */}
          {/* <p className="mt-4 text-sm text-white/65 sm:text-base">
            Organize responsibilities, guarantee storage integrity, and reward
            execution with a single, composable workflow.
          </p>  */}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {featureHighlights.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="group rounded-3xl border border-white/10 bg-[#111827] p-6 text-left shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)] transition hover:border-white/35 hover:bg-[#1a2640]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1628] text-white shadow-inner shadow-black/40">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm text-white/70">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="tech"
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 md:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Built with the best tools
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {techStack.map(({ name, description, icon: Icon }) => (
            <div
              key={name}
              className="rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.8)] transition hover:border-white/35 hover:bg-[#1a2640]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b1628] text-white shadow-inner shadow-black/40">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{name}</h3>
              </div>
              <p className="mt-4 text-sm text-white/70">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-32 md:px-8"
      >
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-white/50">
            Stay in the loop
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Subscribe & connect with the crew
          </h2>
          <p className="mt-4 text-sm text-white/65 sm:text-base">
            Get launch updates, drop feedback, or jam with us on socials.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-8 rounded-3xl border border-white/10 bg-[#111827] p-8 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.9)] lg:flex-row lg:items-stretch lg:gap-10">
          <form className="flex basis-1/2 flex-col justify-between gap-6">
            <div>
              <h3 className="text-left text-lg font-semibold text-white">
                Be first to know
              </h3>
              <p className="mt-2 text-sm text-white/65">
                Enter your email to receive updates on new drops, roadmap
                progress, and upcoming live sessions.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="h-12 flex-1 rounded-full border border-white/15 bg-[#0b1628] px-5 text-sm text-white placeholder-white/40 shadow-inner shadow-black/40 outline-none transition focus:border-white/60 focus:bg-[#111b2e]"
              />
              <button
                type="submit"
                className="h-12 rounded-full bg-white px-8 text-sm font-semibold uppercase tracking-[0.25em] text-slate-900 shadow-[0_10px_30px_rgba(255,255,255,0.35)] transition hover:bg-white/85"
              >
                Notify me
              </button>
            </div>
            <p className="text-left text-xs text-white/40">
              We respect your privacy. Unsubscribe any time.
            </p>
          </form>

          <div className="basis-1/2 space-y-4">
            <h3 className="text-lg font-semibold text-white">
              Connect with the builders
            </h3>
            <div className="grid gap-4">
              {contactLinks.map(({ label, href, icon: Icon, handle }) => (
                <Link
                  key={label}
                  href={href}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#0d1a2f] px-5 py-4 text-left text-sm text-white/70 transition hover:border-white/30 hover:bg-[#15223b] hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#14213a] text-white transition group-hover:bg-[#1f2f50]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{label}</p>
                      <p className="text-xs text-white/60">{handle}</p>
                    </div>
                  </div>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/40 group-hover:text-white/70">
                    Connect
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
