"use client";

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT — portrait + biography + pills, ported from the Vite prototype's
// About.jsx section.
//
// The LAYOUT and CHOREOGRAPHY are the prototype's: a 3:4 portrait on a warm
// backdrop entering from the left, the text column entering from the right a
// beat later, pills staggering up under it, and a slow parallax drift on the
// photo as the section crosses the viewport.
//
// Two deliberate departures:
//
// 1. `motion`, not GSAP + ScrollTrigger. CLAUDE.md pins the animation library
//    and every other reveal on this site (BlurFade, Reveal, SplitText) is built
//    on `useInView`. Adding a second ~70 kB scroll-animation runtime for one
//    section would be the largest dependency on the marketing bundle, to do
//    what motion already does.
//
// 2. All copy arrives as props. The prototype hardcoded a biography containing
//    a superlative ("India's Leading PoSH Law Expert"), a certification claim,
//    and three invented counts — all three marked "COPY: client to review"
//    there, and all three are exactly what CLAUDE.md §1 and the "never invent
//    trained-employee counts" rule forbid shipping. `pills` renders nothing
//    when empty, so the section degrades to no pills rather than to numbers
//    nobody can stand behind. See lib/about.ts.
// ─────────────────────────────────────────────────────────────────────────────

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Container } from "./container";

const EASE = [0.22, 1, 0.36, 1] as const;

export function AboutIntro({
  eyebrow = "About Jyoti",
  heading,
  paragraphs,
  photo,
  pills = [],
  action,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  heading: string;
  paragraphs: readonly string[];
  photo: { src: string; alt: string };
  /** Short credential chips. NEVER pass an invented figure — see header. */
  pills?: readonly string[];
  action?: { label: string; href: string };
  /** `h1` on /about, where this section IS the page heading. */
  as?: "h1" | "h2";
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLUListElement>(null);

  const reduced = useReducedMotion();
  const inView = useInView(sectionRef, { once: true, margin: "-120px" });
  const pillsInView = useInView(pillsRef, { once: true, margin: "-60px" });

  // Parallax is desktop-only, as in the prototype: on a stacked single-column
  // phone layout it just fights the scroll the reader is already doing.
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const drift = useTransform(scrollYProgress, [0, 1], [18, -18]);
  const animate = !reduced && wide;

  return (
    <section
      ref={sectionRef}
      id="about"
      className="border-y border-[var(--brand-line)] bg-[var(--brand-elevated)] py-20 md:py-28"
    >
      <Container>
        <div className="grid items-center gap-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] md:gap-16">
          {/* ── Portrait ───────────────────────────────────────────────── */}
          <motion.div
            initial={reduced ? false : { opacity: 0, x: -48 }}
            animate={
              reduced || inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -48 }
            }
            transition={{ duration: 0.75, ease: EASE }}
            style={animate ? { y: drift } : undefined}
            className="mx-auto w-full max-w-[380px]"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-lg)] bg-[var(--brand-primary-tint)] shadow-[var(--shadow-lg)]">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 768px) 380px, 100vw"
                className="object-cover object-top"
                priority={false}
              />
            </div>
          </motion.div>

          {/* ── Biography ──────────────────────────────────────────────── */}
          <motion.div
            ref={textRef}
            initial={reduced ? false : { opacity: 0, x: 48 }}
            animate={
              reduced || inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 48 }
            }
            transition={{ duration: 0.75, delay: 0.12, ease: EASE }}
          >
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-muted)]">
              {eyebrow}
            </p>

            <Heading className="mt-3 max-w-[22ch] font-serif text-[31px] font-semibold md:text-[39px]">
              {heading}
            </Heading>

            <div className="mt-6 space-y-4">
              {paragraphs.map((p) => (
                <p
                  key={p.slice(0, 40)}
                  className="max-w-[62ch] text-[17px] leading-[1.7] text-[var(--brand-muted)]"
                >
                  {p}
                </p>
              ))}
            </div>

            {pills.length > 0 && (
              <ul ref={pillsRef} className="mt-8 flex flex-wrap gap-2.5">
                {pills.map((pill, i) => (
                  <motion.li
                    key={pill}
                    initial={reduced ? false : { opacity: 0, y: 16 }}
                    animate={
                      reduced || pillsInView
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 16 }
                    }
                    transition={{
                      duration: 0.45,
                      delay: i * 0.08,
                      ease: EASE,
                    }}
                    className="rounded-full bg-[var(--brand-primary-tint)] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-accent-text)]"
                  >
                    {pill}
                  </motion.li>
                ))}
              </ul>
            )}

            {action && (
              <Link
                href={action.href}
                className="group mt-8 inline-flex items-center gap-2 text-[17px] font-semibold text-[var(--brand-primary)]"
              >
                {action.label}
                <span
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            )}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
