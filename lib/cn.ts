/**
 * Minimal class joiner. Deliberately not `clsx` + `tailwind-merge`: our
 * primitives put the caller's `className` last, so plain concatenation already
 * lets callers override. Two fewer dependencies on the critical path.
 */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
