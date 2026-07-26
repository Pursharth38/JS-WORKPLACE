/**
 * CMS migration M6 — one-time Sanity → Postgres content migration.
 *
 *   npx tsx --env-file=.env scripts/migrate-sanity-to-postgres.mts            # DRY RUN (default)
 *   npx tsx --env-file=.env scripts/migrate-sanity-to-postgres.mts --execute  # real writes
 *
 * DRY RUN writes NOTHING — not to Postgres, not to R2. It prints, per type:
 * how many documents would migrate, every Portable Text conversion warning,
 * every image that would upload, and every document that CANNOT be mapped
 * (with the reason). Per CMS-MIGRATION-PLAN.md §5.5 the real run must only
 * happen after a human has read that report.
 *
 * Idempotent by construction: every write is an upsert keyed on the document's
 * Sanity _id (the `sanityId` column), so re-running cannot duplicate rows.
 *
 * Talks to Sanity over its plain HTTP query API (no client lib — scripts
 * shouldn't depend on Next-flavoured fetch wrappers).
 */
import { PrismaClient, Prisma } from "@prisma/client";

import { portableTextToTiptap } from "../lib/portable-text-to-tiptap";
import { CONTENT_IMAGE_PREFIX, imageSrc, sniffImage } from "../lib/images";
import { parseRichText, EMPTY_DOC, type RichTextDoc } from "../lib/richtext";
import { isR2Configured, putObject } from "../lib/r2";

const DRY_RUN = !process.argv.includes("--execute");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const apiVersion = "2024-01-01";
const token = process.env.SANITY_API_READ_TOKEN;

if (!projectId) {
  console.error("NEXT_PUBLIC_SANITY_PROJECT_ID is not set — nothing to migrate from.");
  process.exit(1);
}

const db = new PrismaClient();

/* ── Sanity HTTP query ────────────────────────────────────────────────────── */

async function groq<T>(query: string): Promise<T> {
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Sanity query failed (${res.status}): ${await res.text()}`);
  const payload = (await res.json()) as { result: T };
  return payload.result;
}

/* ── Image pipeline ───────────────────────────────────────────────────────── */

const imagePlan = new Map<string, string>(); // asset ref → stored src
let imagesPlanned = 0;
let imagesUploaded = 0;

/** image-<hash>-<WxH>-<fmt> → CDN URL parts. */
function refToCdn(ref: string): { url: string; ext: string } | null {
  const m = /^image-([A-Za-z0-9]+)-(\d+x\d+)-([a-z0-9]+)$/.exec(ref);
  if (!m) return null;
  return {
    url: `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}-${m[2]}.${m[3]}`,
    ext: m[3]!,
  };
}

async function migrateImage(ref: string): Promise<string | null> {
  const cached = imagePlan.get(ref);
  if (cached) return cached;

  const cdn = refToCdn(ref);
  if (!cdn) return null;

  imagesPlanned += 1;
  const key = `${CONTENT_IMAGE_PREFIX}migrated/${ref.replace(/^image-/, "")}.${cdn.ext === "jpg" ? "jpg" : cdn.ext}`;
  const src = imageSrc(key);

  if (DRY_RUN) {
    imagePlan.set(ref, src);
    return src;
  }

  const res = await fetch(cdn.url);
  if (!res.ok) {
    console.warn(`  ⚠ image download failed (${res.status}): ${ref}`);
    return null;
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!sniffImage(bytes)) {
    console.warn(`  ⚠ downloaded asset is not a supported image: ${ref}`);
    return null;
  }
  await putObject({
    key,
    body: Buffer.from(bytes),
    contentType:
      cdn.ext === "png" ? "image/png" : cdn.ext === "webp" ? "image/webp" : cdn.ext === "gif" ? "image/gif" : "image/jpeg",
  });
  imagesUploaded += 1;
  imagePlan.set(ref, src);
  return src;
}

/** Synchronous resolver for the PT converter: only serves pre-planned refs. */
function resolverFor(preResolved: Map<string, string>): (ref: string) => string | null {
  return (ref) => preResolved.get(ref) ?? null;
}

/** Pre-resolve every image ref inside a PT body so conversion can be sync. */
async function preResolveBodyImages(body: unknown): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  const walk = async (node: unknown): Promise<void> => {
    if (Array.isArray(node)) {
      for (const n of node) await walk(n);
      return;
    }
    if (!node || typeof node !== "object") return;
    const o = node as { _type?: string; asset?: { _ref?: string }; body?: unknown };
    if (o._type === "image" && o.asset?._ref) {
      const src = await migrateImage(o.asset._ref);
      if (src) found.set(o.asset._ref, src);
    }
    if (o.body) await walk(o.body);
  };
  await walk(body);
  return found;
}

/* ── Conversion helper ────────────────────────────────────────────────────── */

const report: Record<string, { migrated: number; skipped: string[]; warnings: string[] }> = {};

function reportFor(type: string) {
  return (report[type] ??= { migrated: 0, skipped: [], warnings: [] });
}

async function convertBody(type: string, docId: string, body: unknown): Promise<RichTextDoc> {
  const images = await preResolveBodyImages(body);
  const { doc, warnings } = portableTextToTiptap(body, resolverFor(images));
  for (const w of warnings) reportFor(type).warnings.push(`${docId}: ${w}`);
  // The converter's output must clear the same gate as the admin editor.
  return parseRichText(doc);
}

/* ── Per-type migrations ──────────────────────────────────────────────────── */

type SanityDoc = Record<string, unknown> & { _id: string };

async function migrateFaqs() {
  const r = reportFor("faq");
  const docs = await groq<SanityDoc[]>(`*[_type=="faq"]{_id, question, answer, category, order}`);
  for (const d of docs) {
    const answer = await convertBody("faq", d._id, d.answer);
    const data = {
      question: String(d.question ?? ""),
      answer: answer as unknown as Prisma.InputJsonValue,
      category: String(d.category ?? "General"),
      order: Number(d.order ?? 0),
      isPublished: true,
    };
    if (!DRY_RUN) {
      await db.faq.upsert({ where: { sanityId: d._id }, create: { sanityId: d._id, ...data }, update: data });
    }
    r.migrated += 1;
  }
}

async function migrateTestimonials() {
  const r = reportFor("testimonial");
  const docs = await groq<SanityDoc[]>(
    `*[_type=="testimonial"]{_id, quote, authorName, authorRole, organization, consentOnFile, order}`,
  );
  for (const d of docs) {
    if (d.consentOnFile !== true) {
      r.skipped.push(`${d._id}: consentOnFile is not true — refused, same rule as everywhere`);
      continue;
    }
    const data = {
      quote: String(d.quote ?? ""),
      authorName: String(d.authorName ?? ""),
      authorRole: (d.authorRole as string | undefined) ?? null,
      organization: (d.organization as string | undefined) ?? null,
      consentOnFile: true,
      order: Number(d.order ?? 0),
      isPublished: true,
    };
    if (!DRY_RUN) {
      await db.testimonial.upsert({ where: { sanityId: d._id }, create: { sanityId: d._id, ...data }, update: data });
    }
    r.migrated += 1;
  }
}

async function migrateServices() {
  const r = reportFor("service");
  const docs = await groq<SanityDoc[]>(
    `*[_type=="service"]{_id, title, "slug": slug.current, summary, order, icon, whoItIsFor, whatIsCovered, format, body, seoTitle, seoDescription}`,
  );
  for (const d of docs) {
    if (!d.slug) {
      r.skipped.push(`${d._id}: no slug`);
      continue;
    }
    const body = d.body ? await convertBody("service", d._id, d.body) : null;
    const data = {
      title: String(d.title ?? ""),
      slug: String(d.slug),
      summary: String(d.summary ?? ""),
      order: Number(d.order ?? 0),
      icon: (d.icon as string | undefined) ?? null,
      whoItIsFor: (d.whoItIsFor as string[] | undefined) ?? [],
      whatIsCovered: (d.whatIsCovered as string[] | undefined) ?? [],
      format: (d.format as string | undefined) ?? null,
      body: (body as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      seoTitle: (d.seoTitle as string | undefined) ?? null,
      seoDescription: (d.seoDescription as string | undefined) ?? null,
      isPublished: true,
    };
    if (!DRY_RUN) {
      await db.service.upsert({ where: { sanityId: d._id }, create: { sanityId: d._id, ...data }, update: data });
    }
    r.migrated += 1;
  }
}

async function migrateInstagram() {
  const r = reportFor("instagramPost");
  const docs = await groq<SanityDoc[]>(
    `*[_type=="instagramPost"]{_id, "imageRef": image.asset._ref, "imageAlt": image.alt, permalink, caption, order}`,
  );
  for (const d of docs) {
    const ref = d.imageRef as string | undefined;
    if (!ref) {
      r.skipped.push(`${d._id}: no image`);
      continue;
    }
    const src = await migrateImage(ref);
    if (!src) {
      r.skipped.push(`${d._id}: image ${ref} could not be migrated`);
      continue;
    }
    const key = src.replace("/api/images/", "");
    const data = {
      imageKey: key,
      imageAlt: (d.imageAlt as string | undefined) ?? null,
      permalink: String(d.permalink ?? ""),
      caption: String(d.caption ?? ""),
      order: Number(d.order ?? 0),
      isPublished: true,
    };
    if (!DRY_RUN) {
      await db.instagramPost.upsert({ where: { sanityId: d._id }, create: { sanityId: d._id, ...data }, update: data });
    }
    r.migrated += 1;
  }
}

async function migrateSiteSettings() {
  const r = reportFor("siteSettings");
  const d = await groq<SanityDoc | null>(`*[_type=="siteSettings"][0]`);
  if (!d) {
    r.skipped.push("no siteSettings document in Sanity");
    return;
  }
  const ann = (d.announcement as { enabled?: boolean; text?: string; href?: string } | undefined) ?? {};
  const data = {
    businessName: String(d.businessName ?? "JS Workplace Wellness"),
    email: String(d.email ?? ""),
    phone: (d.phone as string | undefined) ?? null,
    whatsappNumber: (d.whatsappNumber as string | undefined) ?? null,
    whatsappDefaultMessage: (d.whatsappDefaultMessage as string | undefined) ?? null,
    addressLines: (d.addressLines as string[] | undefined) ?? [],
    linkedinUrl: (d.linkedinUrl as string | undefined) ?? null,
    instagramUrl: (d.instagramUrl as string | undefined) ?? null,
    youtubeUrl: (d.youtubeUrl as string | undefined) ?? null,
    announcementEnabled: ann.enabled ?? false,
    announcementText: ann.text ?? null,
    announcementHref: ann.href ?? null,
    heroHeading: (d.heroHeading as string | undefined) ?? null,
    heroSubheading: (d.heroSubheading as string | undefined) ?? null,
    heroPrimaryCtaLabel: (d.heroPrimaryCtaLabel as string | undefined) ?? null,
    heroPrimaryCtaHref: (d.heroPrimaryCtaHref as string | undefined) ?? null,
    legalEntityName: (d.legalEntityName as string | undefined) ?? null,
    gstin: (d.gstin as string | undefined) ?? null,
    supportEmail: (d.supportEmail as string | undefined) ?? null,
  };
  if (!DRY_RUN) {
    await db.siteSettingsRow.upsert({ where: { id: "singleton" }, create: { id: "singleton", ...data }, update: data });
  }
  r.migrated += 1;
}

async function migrateCategoriesAndPosts() {
  const rc = reportFor("category");
  const cats = await groq<SanityDoc[]>(`*[_type=="category"]{_id, title, "slug": slug.current, description}`);
  const catIdBySanity = new Map<string, string>();
  for (const d of cats) {
    if (!d.slug) {
      rc.skipped.push(`${d._id}: no slug`);
      continue;
    }
    const data = {
      title: String(d.title ?? ""),
      slug: String(d.slug),
      description: (d.description as string | undefined) ?? null,
    };
    if (!DRY_RUN) {
      const row = await db.blogCategory.upsert({
        where: { sanityId: d._id },
        create: { sanityId: d._id, ...data },
        update: data,
      });
      catIdBySanity.set(d._id, row.id);
    }
    rc.migrated += 1;
  }

  const rp = reportFor("post");
  const posts = await groq<SanityDoc[]>(
    `*[_type=="post"]{_id, title, "slug": slug.current, excerpt, publishedAt, tags,
      "categoryRef": category._ref, "coverRef": coverImage.asset._ref, "coverAlt": coverImage.alt,
      body, seoTitle, seoDescription, "relatedHubAnchors": relatedHubAnchors[]->anchor.current}`,
  );
  for (const d of posts) {
    if (!d.slug) {
      rp.skipped.push(`${d._id}: no slug`);
      continue;
    }
    const body = await convertBody("post", d._id, d.body);
    const coverRef = d.coverRef as string | undefined;
    const coverSrc = coverRef ? await migrateImage(coverRef) : null;

    const data = {
      title: String(d.title ?? ""),
      slug: String(d.slug),
      excerpt: String(d.excerpt ?? ""),
      body: body as unknown as Prisma.InputJsonValue,
      coverImageKey: coverSrc ? coverSrc.replace("/api/images/", "") : null,
      coverImageAlt: (d.coverAlt as string | undefined) ?? null,
      categoryId: d.categoryRef ? (catIdBySanity.get(String(d.categoryRef)) ?? null) : null,
      tags: (d.tags as string[] | undefined) ?? [],
      relatedHubAnchors: ((d.relatedHubAnchors as (string | null)[] | undefined) ?? []).filter(
        (a): a is string => !!a,
      ),
      seoTitle: (d.seoTitle as string | undefined) ?? null,
      seoDescription: (d.seoDescription as string | undefined) ?? null,
      isPublished: true,
      publishedAt: d.publishedAt ? new Date(String(d.publishedAt)) : new Date(),
    };
    if (!DRY_RUN) {
      await db.blogPost.upsert({ where: { sanityId: d._id }, create: { sanityId: d._id, ...data }, update: data });
    }
    rp.migrated += 1;
  }
}

async function migrateHub() {
  const rs = reportFor("poshSection");
  const sections = await groq<SanityDoc[]>(
    `*[_type=="poshSection"]{_id, title, "anchor": anchor.current, group, order, summary, isFaq, body}`,
  );
  for (const d of sections) {
    if (!d.anchor) {
      rs.skipped.push(`${d._id}: no anchor`);
      continue;
    }
    const body = await convertBody("poshSection", d._id, d.body);
    const data = {
      title: String(d.title ?? ""),
      anchor: String(d.anchor),
      group: String(d.group ?? "Background"),
      order: Number(d.order ?? 0),
      summary: (d.summary as string | undefined) ?? null,
      isFaq: d.isFaq === true,
      body: body as unknown as Prisma.InputJsonValue,
      isPublished: true,
    };
    if (!DRY_RUN) {
      await db.poshSection.upsert({ where: { sanityId: d._id }, create: { sanityId: d._id, ...data }, update: data });
    }
    rs.migrated += 1;
  }

  const rq = reportFor("quickReference");
  const refs = await groq<SanityDoc[]>(
    `*[_type=="quickReference"]{_id, title, "anchor": anchor.current, order, intro, body}`,
  );
  for (const d of refs) {
    if (!d.anchor) {
      rq.skipped.push(`${d._id}: no anchor`);
      continue;
    }
    const body = await convertBody("quickReference", d._id, d.body);
    const data = {
      title: String(d.title ?? ""),
      anchor: String(d.anchor),
      order: Number(d.order ?? 0),
      intro: (d.intro as string | undefined) ?? null,
      body: body as unknown as Prisma.InputJsonValue,
      isPublished: true,
    };
    if (!DRY_RUN) {
      await db.quickReference.upsert({ where: { sanityId: d._id }, create: { sanityId: d._id, ...data }, update: data });
    }
    rq.migrated += 1;
  }

  const rb = reportFor("ctaBand");
  const bands = await groq<SanityDoc[]>(
    `*[_type=="ctaBand"]{_id, heading, body, buttonLabel, buttonHref, afterGroup}`,
  );
  for (const d of bands) {
    const data = {
      heading: String(d.heading ?? ""),
      body: (d.body as string | undefined) ?? null,
      buttonLabel: String(d.buttonLabel ?? "Learn more"),
      buttonHref: String(d.buttonHref ?? "/contact"),
      afterGroup: (d.afterGroup as string | undefined) ?? null,
      isPublished: true,
    };
    if (!DRY_RUN) {
      await db.ctaBand.upsert({ where: { sanityId: d._id }, create: { sanityId: d._id, ...data }, update: data });
    }
    rb.migrated += 1;
  }
}

async function migrateCourses() {
  const r = reportFor("course");
  const courses = await groq<SanityDoc[]>(
    `*[_type=="course"]{_id, title, "slug": slug.current, summary, description, learningOutcomes,
      durationMinutes, priceInPaise, passThreshold, isPublished, faqs, seoTitle, seoDescription}`,
  );
  const courseIdBySanity = new Map<string, string>();
  for (const d of courses) {
    if (!d.slug) {
      r.skipped.push(`${d._id}: no slug`);
      continue;
    }
    const description = d.description ? await convertBody("course", d._id, d.description) : null;
    const contentData = {
      title: String(d.title ?? ""),
      slug: String(d.slug),
      summary: String(d.summary ?? ""),
      description: (description as unknown as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      learningOutcomes: (d.learningOutcomes as string[] | undefined) ?? [],
      courseFaqs: (d.faqs as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
      durationMinutes: d.durationMinutes != null ? Number(d.durationMinutes) : null,
      priceInPaise: Number(d.priceInPaise ?? 0),
      passThreshold: Number(d.passThreshold ?? 85),
      isPublished: d.isPublished === true,
      seoTitle: (d.seoTitle as string | undefined) ?? null,
      seoDescription: (d.seoDescription as string | undefined) ?? null,
    };
    if (!DRY_RUN) {
      const row = await db.course.upsert({
        where: { sanityId: d._id },
        create: { sanityId: d._id, ...contentData },
        update: contentData,
      });
      courseIdBySanity.set(d._id, row.id);
    }
    r.migrated += 1;
  }

  const rc = reportFor("chapter");
  const chapters = await groq<SanityDoc[]>(
    `*[_type=="chapter"]{_id, title, "courseRef": course._ref, order, summary, passThreshold}`,
  );
  const chapterIdBySanity = new Map<string, string>();
  for (const d of chapters) {
    const courseId = courseIdBySanity.get(String(d.courseRef));
    if (!DRY_RUN && !courseId) {
      rc.skipped.push(`${d._id}: course ${String(d.courseRef)} not migrated`);
      continue;
    }
    const data = {
      title: String(d.title ?? ""),
      order: Number(d.order ?? 0),
      summary: (d.summary as string | undefined) ?? null,
      passThreshold: Number(d.passThreshold ?? 80),
    };
    if (!DRY_RUN) {
      const row = await db.chapter.upsert({
        where: { sanityId: d._id },
        create: { sanityId: d._id, courseId: courseId!, ...data },
        update: data,
      });
      chapterIdBySanity.set(d._id, row.id);
    }
    rc.migrated += 1;
  }

  const rm = reportFor("module");
  const modules = await groq<SanityDoc[]>(
    `*[_type=="module"]{_id, title, "chapterRef": chapter._ref, order, videoUid, durationSeconds, isFreePreview, summary, resources}`,
  );
  for (const d of modules) {
    const chapterId = chapterIdBySanity.get(String(d.chapterRef));
    if (!DRY_RUN && !chapterId) {
      rm.skipped.push(`${d._id}: chapter ${String(d.chapterRef)} not migrated`);
      continue;
    }
    if (Array.isArray(d.resources) && d.resources.length > 0) {
      rm.warnings.push(`${d._id}: has ${d.resources.length} resources — Prisma Module has no resources field; NOT carried over`);
    }
    const data = {
      title: String(d.title ?? ""),
      order: Number(d.order ?? 0),
      videoUid: String(d.videoUid ?? ""),
      durationSeconds: Number(d.durationSeconds ?? 0),
      isFreePreview: d.isFreePreview === true,
    };
    if (!DRY_RUN) {
      await db.module.upsert({
        where: { sanityId: d._id },
        create: { sanityId: d._id, chapterId: chapterId!, ...data },
        update: data,
      });
    }
    rm.migrated += 1;
  }

  const rq = reportFor("question");
  const questions = await groq<SanityDoc[]>(
    `*[_type=="question"]{_id, text, "chapterRef": chapter._ref, "courseRef": course._ref, isFinalTest, topic, explanation,
      "options": options[]{"id": _key, text, isCorrect}}`,
  );
  for (const d of questions) {
    const chapterRef = d.chapterRef as string | undefined;
    if (!chapterRef) {
      rq.skipped.push(
        `${d._id}: ${d.isFinalTest ? "final-test question with no chapter" : "no chapter ref"} — Prisma Question requires a chapter; the final test draws across chapter pools instead`,
      );
      continue;
    }
    const chapterId = chapterIdBySanity.get(chapterRef);
    if (!DRY_RUN && !chapterId) {
      rq.skipped.push(`${d._id}: chapter ${chapterRef} not migrated`);
      continue;
    }
    const options = ((d.options as { id?: string; text?: string; isCorrect?: boolean }[]) ?? []).map(
      (o, i) => ({
        id: o.id ?? String.fromCharCode(97 + i),
        text: String(o.text ?? ""),
        isCorrect: o.isCorrect === true,
      }),
    );
    if (options.filter((o) => o.isCorrect).length !== 1) {
      rq.skipped.push(`${d._id}: does not have exactly one correct option`);
      continue;
    }
    const data = {
      text: String(d.text ?? ""),
      topic: String(d.topic ?? "General"),
      explanation: (d.explanation as string | undefined) ?? null,
      options: options as unknown as Prisma.InputJsonValue,
      isActive: true,
    };
    if (!DRY_RUN) {
      await db.question.upsert({
        where: { sanityId: d._id },
        create: { sanityId: d._id, chapterId: chapterId!, ...data },
        update: data,
      });
    }
    rq.migrated += 1;
  }
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

async function main() {
  console.log(`\n━━━ Sanity → Postgres content migration ━━━`);
  console.log(`Mode:    ${DRY_RUN ? "DRY RUN (no writes)" : "★ EXECUTE — writing to Postgres and R2 ★"}`);
  console.log(`Source:  project ${projectId}, dataset ${dataset}`);
  console.log(`R2:      ${isR2Configured() ? "configured" : "NOT configured" + (DRY_RUN ? " (fine for dry run)" : " — image uploads will fail")}\n`);

  if (!DRY_RUN && !isR2Configured()) {
    console.error("Refusing to execute: R2 is not configured, images would be lost. Set the R2_* env vars.");
    process.exit(1);
  }

  await migrateSiteSettings();
  await migrateFaqs();
  await migrateTestimonials();
  await migrateServices();
  await migrateInstagram();
  await migrateCategoriesAndPosts();
  await migrateHub();
  await migrateCourses();

  console.log("━━━ Report ━━━");
  let totalMigrated = 0;
  let totalSkipped = 0;
  for (const [type, r] of Object.entries(report)) {
    totalMigrated += r.migrated;
    totalSkipped += r.skipped.length;
    console.log(`\n${type}: ${DRY_RUN ? "would migrate" : "migrated"} ${r.migrated}`);
    for (const s of r.skipped) console.log(`  ✗ SKIPPED ${s}`);
    for (const w of r.warnings) console.log(`  ⚠ ${w}`);
  }
  console.log(`\nImages: ${DRY_RUN ? `${imagesPlanned} would upload to R2` : `${imagesUploaded}/${imagesPlanned} uploaded`}`);
  console.log(`Totals: ${totalMigrated} documents ${DRY_RUN ? "ready" : "written"}, ${totalSkipped} skipped\n`);

  if (DRY_RUN) {
    console.log("Dry run complete — nothing was written.");
    console.log("Read the skips/warnings above, then run with --execute to migrate for real.");
    console.log("NOTE: executing flips the site to Postgres content type-by-type (the flip rule");
    console.log("in lib/content/*). Sanity itself is NOT touched; Studio and the webhook stay");
    console.log("live until the separate, explicitly-approved decommission step.\n");
  }

  // parseRichText import is exercised through convertBody; EMPTY_DOC anchors
  // the type import so tsx tree-shaking never drops the module.
  void EMPTY_DOC;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
