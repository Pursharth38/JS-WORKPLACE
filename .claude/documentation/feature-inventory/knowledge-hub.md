# Knowledge Hub — Section Inventory
> `/posh-act`. Owner: Dev A. This is the SEO centerpiece and the client's stated priority.
> Every word original and client-supplied. Never copy or close-paraphrase elearnposh.com.

## Groups and sections (11 groups)

| # | Group | Sections | Anchor prefix |
|---|---|---|---|
| 1 | Compliance | Employer duties · What constitutes non-compliance · Penalties | `compliance-` |
| 2 | Policy | Formulating a POSH policy · Can it be gender-neutral | `policy-` |
| 3 | Internal Committee | Constitution · Tenure · Disqualification · External member role | `ic-` |
| 4 | Local Committee | Constitution · Jurisdiction · District Officer | `lc-` |
| 5 | Definitions | Sexual harassment · Workplace (incl. remote) · Employer | `def-` |
| 6 | Complaints | Who can complain · Deadlines · Anonymous complaints · Police complaint | `complaint-` |
| 7 | Redressal | Conciliation · Inquiry process · Timelines · Interim relief · Inquiry report | `redressal-` |
| 8 | False Complaints | Punishment · Lack of evidence ≠ false · Penalties | `false-` |
| 9 | Confidentiality | Mandatory confidentiality · Confidentiality vs anonymity · Breach penalty | `conf-` |
| 10 | Appeal | Grounds · 90-day timeline | `appeal-` |
| 11 | Background | Vishaka Guidelines · Bhanwari Devi · Constitutional basis | `bg-` |

## Build requirements
- Each H2 section is a separate Sanity `poshSection` document with `group`, `order`, `anchor`
- Sticky `TocSidebar` with scroll-spy; collapsible on mobile
- `ReadingProgress` bar + `BackToTop` FAB
- Max measure 68ch; body 17px / 1.7
- Sanity-managed inline CTA bands between groups
- JSON-LD: `Article` + `FAQPage` + `BreadcrumbList`

## Anchors are permanent URLs
Once launched, people share and link these. **Never rename an anchor without a redirect.**
The `anchor` field in Sanity carries a description saying exactly this.

## Content risk
This is the highest-risk item in the project. If the client delivers 6 groups instead of 11, ship 6
written well. Fewer sections written properly beats more sections paraphrased from a competitor —
paraphrase does not rank and it is copyright exposure for her.

## Long-tail targets this page owns
"is home a workplace under POSH" · "can a man file a POSH complaint" · "POSH annual report format" ·
"penalty for POSH non-compliance" · "external member IC remuneration" · "POSH inquiry timeline" ·
"IC constitution rules" · "POSH conciliation process"
