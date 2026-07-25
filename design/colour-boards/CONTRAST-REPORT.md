# Colour Boards — Measured Contrast Report
> P0-03 supporting evidence. Owner: Dev A.
> Client-facing comps: `index.html` · Tokens land in P1-02 · Verified again at P1-R `/plan-design-review`

All ratios below were **computed**, not estimated — WCAG 2.1 relative luminance, sRGB, computed with
`scripts/contrast.mjs` methodology (see bottom). Reproduce before changing any token.

**Thresholds:** normal text 4.5:1 (AA) · large text ≥18px or ≥14px bold 3.0:1 (AA) ·
non-text UI and focus indicators 3.0:1 · AAA 7.0:1.

---

## Board A — Deep Teal (recommended)

| Pairing | Ratio | Body AA | Large AA | AAA |
|---|---:|:--:|:--:|:--:|
| Ink `#101828` on Sand `#FBF9F5` — body | 16.88:1 | ✅ | ✅ | ✅ |
| Slate `#475467` on Sand — secondary | 7.31:1 | ✅ | ✅ | ✅ |
| Deep Teal `#0F5257` on Sand — headings | 8.44:1 | ✅ | ✅ | ✅ |
| Teal 600 `#14746F` on Sand — links | 5.31:1 | ✅ | ✅ | ❌ |
| **Amber 500 `#C77D26` on Sand — accent** | **3.13:1** | **❌** | ✅ | ❌ |
| White on Deep Teal — primary button | 8.88:1 | ✅ | ✅ | ✅ |
| White on Teal 600 — button hover | 5.59:1 | ✅ | ✅ | ❌ |
| **White on Amber 500 — CTA button** | **3.29:1** | **❌** | ✅ | ❌ |
| Ink on Teal 50 `#EAF4F3` — tint band | 15.83:1 | ✅ | ✅ | ✅ |
| Deep Teal on Teal 50 | 7.92:1 | ✅ | ✅ | ✅ |
| Success `#067647` on Sand | 5.41:1 | ✅ | ✅ | ❌ |
| Error `#B42318` on Sand | 6.25:1 | ✅ | ✅ | ❌ |
| Warning `#B54708` on Sand | 5.16:1 | ✅ | ✅ | ❌ |

## Board B — Deep Indigo

| Pairing | Ratio | Body AA | Large AA | AAA |
|---|---:|:--:|:--:|:--:|
| Ink on Cream `#FCFAF7` — body | 17.03:1 | ✅ | ✅ | ✅ |
| Slate on Cream — secondary | 7.38:1 | ✅ | ✅ | ✅ |
| Indigo `#1E2A5A` on Cream — headings | 13.14:1 | ✅ | ✅ | ✅ |
| **Clay `#B85C38` on Cream — accent** | **4.36:1** | **❌** | ✅ | ❌ |
| White on Indigo — primary button | 13.69:1 | ✅ | ✅ | ✅ |
| White on Clay — CTA button | 4.54:1 | ✅ | ✅ | ❌ |
| Indigo 600 `#33417A` on Cream — links *(derived)* | 9.25:1 | ✅ | ✅ | ✅ |
| Ink on Indigo 50 `#ECEEF6` — tint *(derived)* | 15.32:1 | ✅ | ✅ | ✅ |

**Derived values.** `DETAILED-PLAN.md` §4.1 specifies only Indigo, Clay and Cream for Board B. Indigo 600
and Indigo 50 were derived by Dev A so the board could be presented as a complete working system — a
palette needs an interactive state and a tint. **If the client picks Board B, both need explicit
confirmation before P1-02.** Flagged in the client-facing comp.

---

## Finding 1 — `GSTACK.md` prediction confirmed

`GSTACK.md` §Phase-1 states the expected `/plan-design-review` answer is that Amber `#C77D26` on Sand
`#FBF9F5` does **not** clear 4.5:1 at body size. **Confirmed: 3.13:1.** Large text only (≥18px), exactly as
`CLAUDE.md` and `platform-agent.md` already require. No change needed — the docs are correct.

## Finding 2 — undocumented gap: white text on Amber fails AA ⚠️

`CLAUDE.md` and `platform-agent.md` both constrain **Amber on Sand**. Neither constrains **white on Amber**,
which is the far more common real usage — Amber is specified as "accent, **CTAs**", and a CTA is a filled
button with a label on it.

```
White  #FFFFFF on Amber 500 #C77D26  →  3.29:1   ✗ fails body AA
Ink    #101828 on Amber 500 #C77D26  →  5.40:1   ✓ passes at every size
```

A primary CTA reading white-on-amber fails AA unless every button label is ≥18px. That is a real
constraint to carry through the whole component library, and it will not survive contact with a 14px
button in a card.

**Recommendation — no palette change.** Keep Amber 500 `#C77D26` exactly as signed off. Set the *label*
colour on amber fills to Ink. This costs nothing, keeps the accent the client approved, and passes at any
size. Both amber CTAs in the comp already render this way.

## Finding 3 — Amber has no body-text-safe variant

Amber is unusable for any text below 18px on Sand. The moment someone needs an amber inline link, small
label, or icon-with-text, there is no compliant value available and the palette will get improvised at
build time. Add one now:

```
Amber 700  #9C5D1C    5.00:1 on Sand ✓   5.26:1 with white ✓
```

Not a brand change — a same-hue darker step, used only where amber must carry small text.

## Finding 4 — Board B's Clay is marginal in both directions

Clay `#B85C38` measures 4.36:1 on Cream (fails body AA by a hair) and white-on-Clay is 4.54:1 (passes with
0.04 of margin). Both sit on the threshold, which is fragile — any later tint or opacity tweak breaks it.
If Board B is chosen, darken to **Clay 600 `#A94F2E`**: 5.24:1 on Cream, 5.46:1 with white.

---

## Proposed token additions for P1-02

Only if Board A is selected. Everything else in `platform-agent.md` §DESIGN TOKENS is unchanged.

```
Amber 500   #C77D26   accent fills, large CTAs        ← unchanged
Amber 700   #9C5D1C   amber TEXT at body size         ← NEW (Finding 3)
on-amber    #101828   label colour on amber fills     ← NEW (Finding 2), Ink not white
focus ring  #0F5257   8.44:1 on Sand, non-text ✓      ← NEW, Deep Teal not Amber (3.13:1 is too weak)
```

Encode the amber rule in Tailwind so it cannot be got wrong by accident: expose `bg-amber` only paired
with `text-ink`, and do not expose `text-amber-500` at all — only `text-amber-700`.

---

## Open decision — blocks P1-02

Client must pick Board A or Board B (P0-03). Until then Phase 1 token work is not safe to start:
`tasks.md` marks P0-03 as blocking Phase 1, and every page built afterwards inherits the choice.

## Reproducing these numbers

WCAG 2.1 relative luminance over sRGB:

```js
const lum = (hex) => {
  const c = hex.replace('#','');
  const [r,g,b] = [0,2,4].map(i => parseInt(c.slice(i,i+2),16) / 255);
  const f = v => v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4);
  return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b);
};
const ratio = (a,b) => { const [l1,l2] = [lum(a),lum(b)].sort((x,y)=>y-x); return (l1+0.05)/(l2+0.05); };
```

Re-run against the final tokens during P12-06 (axe-core pass) — axe checks rendered output and will catch
any pairing that drifted during the build.
