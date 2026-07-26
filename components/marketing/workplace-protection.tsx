"use client";

import {
  Briefcase,
  Building2,
  GraduationCap,
  Handshake,
  Home,
  Truck,
  UserCheck,
} from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";

import { BorderBeam } from "@/components/motion/border-beam";
import { LoopVideo } from "@/components/motion/loop-video";
import { Card } from "@/components/ui/card";
import { Container } from "./container";

/**
 * Phase 11, Animation C — "who the Act protects" (DETAILED-PLAN §4.4).
 *
 * BUILT WITH MOTION, NOT LOTTIE — same reasoning as Animation A
 * (harassment-spectrum.tsx) and Animation B (complaint-journey.tsx). See
 * complaint-journey.tsx's header comment for why.
 *
 * Roles orbit a "Workplace" hub, positioned with trigonometry (not a fixed
 * grid) so the layout genuinely reads as "orbiting" rather than a list —
 * matching the spec's literal description. Percent-based radius means the
 * whole thing scales with the container at every breakpoint without
 * recomputation.
 *
 * ⚠️ LEGAL CARE: the Act's definitions of "employee" (2(f)) and "aggrieved
 * woman" (2(a)) are broad — an aggrieved woman need not be an employee at
 * all — and coverage was extended to domestic workers by later notification.
 * "Workplace" (2(o)) explicitly includes any place visited in the course of
 * employment, including employer-arranged transport. Remote/home-based work
 * is deliberately phrased as an employer-policy extension below, not stated
 * as settled statutory text — that distinction matters on a site whose whole
 * value proposition is not overclaiming legal authority.
 */

type Role = {
  icon: typeof Briefcase;
  label: string;
};

const ROLES: Role[] = [
  { icon: Briefcase, label: "Employee" },
  { icon: GraduationCap, label: "Intern / trainee" },
  { icon: Handshake, label: "Contract & gig worker" },
  { icon: Home, label: "Domestic worker" },
  { icon: UserCheck, label: "Client-site visitor" },
  { icon: Truck, label: "Vendor" },
];

const RADIUS_PERCENT = 40;

export function WorkplaceProtection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <section className="bg-[var(--brand-surface)] py-20">
      <Container>
        <div className="mx-auto max-w-[62ch] text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
            Who is covered
          </p>
          <h2 className="mt-3 font-serif text-[31px] font-semibold md:text-[39px]">
            The Act protects more people than most policies assume
          </h2>
          <p className="mt-4 text-[17px] leading-[1.7] text-[var(--brand-muted)]">
            An aggrieved woman does not need to be a direct employee. Coverage
            extends well beyond the regular staff on a payroll.
          </p>
        </div>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div
            ref={ref}
            className="relative mx-auto aspect-square w-full max-w-[220px] sm:max-w-[300px] md:max-w-[360px]"
          >
            {/* Orbit ring — decorative. */}
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-dashed border-[var(--brand-line)]"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                animate
                  ? { opacity: 1, scale: 1 }
                  : { opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.8 }
              }
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />

            {/* Hub */}
            <motion.div
              className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-full bg-[var(--brand-primary)] text-white shadow-[var(--shadow-lg)] sm:h-24 sm:w-24"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={
                animate
                  ? { opacity: 1, scale: 1 }
                  : { opacity: reduced ? 1 : 0, scale: reduced ? 1 : 0.7 }
              }
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Building2 aria-hidden="true" size={20} strokeWidth={2} />
              <span className="text-[11px] font-semibold leading-none sm:text-[12px]">
                Workplace
              </span>
            </motion.div>

            {/* Orbiting roles — positioned by angle, not a grid, so this reads
              as orbiting rather than listed. The `<li>`s are `absolute`, so
              they position against this section's `relative` wrapper rather
              than the `<ul>` — no `display: contents` needed, which is what
              we want, since that property strips list semantics from some
              screen readers. DOM order stays a plain reading order for
              assistive tech regardless of visual position. */}
            <ul>
              {ROLES.map((role, i) => {
                const angleDeg = -90 + i * (360 / ROLES.length);
                const angleRad = (angleDeg * Math.PI) / 180;
                const left = 50 + RADIUS_PERCENT * Math.cos(angleRad);
                const top = 50 + RADIUS_PERCENT * Math.sin(angleRad);
                const Icon = role.icon;

                return (
                  <li
                    key={role.label}
                    className="absolute flex w-[74px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 text-center sm:w-[92px]"
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <motion.div
                      className="flex flex-col items-center gap-1.5"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={
                        animate
                          ? { opacity: 1, scale: 1 }
                          : {
                              opacity: reduced ? 1 : 0,
                              scale: reduced ? 1 : 0.5,
                            }
                      }
                      transition={{
                        delay: 0.15 + i * 0.08,
                        duration: 0.4,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--brand-line)] bg-[var(--brand-elevated)] text-[var(--brand-primary)] sm:h-11 sm:w-11">
                        <Icon aria-hidden="true" size={16} strokeWidth={2} />
                      </span>
                      <span className="text-[11px] font-medium leading-tight text-[var(--brand-ink)] sm:text-[12.5px]">
                        {role.label}
                      </span>
                    </motion.div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Parallel to the diagram, not a replacement for it — the diagram
              stays because it's real DOM text (screen-reader and SEO value
              the video's baked-in captions can't offer) and it's theme-aware,
              which a fixed-palette video can never be. The video is the same
              "who is covered" idea rendered as a motion-graphics walkthrough,
              running alongside it as a second, complementary take. */}
          <div className="mx-auto w-full max-w-[420px]">
            <BorderBeam className="h-full">
              <Card className="group relative h-full p-4">
                <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                  See it in motion
                </p>
                <h3 className="mt-1 font-serif text-[18px] font-semibold">
                  Coverage, mapped
                </h3>
                <LoopVideo
                  src="/videos/who-is-covered-loop.mp4"
                  poster="/videos/who-is-covered-loop-poster.jpg"
                  alt="Animated walkthrough: the POSH Act's coverage extends from the core workplace out to vendors, gig workers, interns, and on-site visitors."
                  className="mt-3 aspect-video w-full rounded-[var(--radius-md)] object-cover"
                />
              </Card>
            </BorderBeam>
          </div>
        </div>

        <p className="mx-auto mt-14 max-w-[62ch] text-center text-[15px] leading-[1.7] text-[var(--brand-muted)]">
          &ldquo;Workplace&rdquo; is defined broadly — it follows the employee
          to any site visited in the course of work, including employer-arranged
          travel, not just the registered office. Many employers now extend the
          same policy to remote and home-based work as a matter of good
          practice, even where a specific arrangement isn&rsquo;t spelled out in
          the statute itself.
        </p>
      </Container>
    </section>
  );
}
