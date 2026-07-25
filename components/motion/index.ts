/**
 * Motion primitives.
 *
 * House rules for everything in this folder:
 *   1. `prefers-reduced-motion` short-circuits to a static render. Not a
 *      reduced animation — no animation. DETAILED-PLAN §4.6.
 *   2. Reveals fire ONCE. Re-animating on scroll-back is distracting on a long
 *      legal guide, which is most of this site.
 *   3. Nothing here gates content. Text is in the DOM whether or not motion
 *      runs, so the SEO and screen-reader value never depends on JavaScript.
 *   4. Animation is decoration. If it fails to load, the page still works.
 */
export { BlurFade, BlurFadeStagger } from "./blur-fade";
export { CountUp } from "./count-up";
export { SplitText } from "./split-text";
export { Reveal } from "./reveal";
