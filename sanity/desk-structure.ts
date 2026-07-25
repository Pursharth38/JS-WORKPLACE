import type { StructureResolver } from "sanity/structure";

/**
 * Custom Studio navigation.
 *
 * The default Studio lists document types alphabetically, which puts "Chapter"
 * above "Site settings" and gives the client no sense of what belongs to what.
 * This groups the Studio the way she thinks about her site: the guide, the blog,
 * her services, the course, and the settings.
 *
 * `siteSettings` is pinned as a singleton — without this the client can create a
 * second settings document and then wonder why the phone number did not update.
 */
export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .child(
          S.document()
            .schemaType("siteSettings")
            .documentId("siteSettings")
            .title("Site settings"),
        ),

      S.divider(),

      S.listItem()
        .title("POSH guide")
        .child(
          S.documentTypeList("poshSection")
            .title("Guide sections")
            .defaultOrdering([
              { field: "group", direction: "asc" },
              { field: "order", direction: "asc" },
            ]),
        ),

      S.listItem()
        .title("IC quick reference")
        .child(
          S.documentTypeList("quickReference")
            .title("Quick reference cards")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),

      S.listItem()
        .title("Blog")
        .child(
          S.list()
            .title("Blog")
            .items([
              S.listItem()
                .title("Posts")
                .child(
                  S.documentTypeList("post")
                    .title("Posts")
                    .defaultOrdering([
                      { field: "publishedAt", direction: "desc" },
                    ]),
                ),
              S.listItem()
                .title("Categories")
                .child(S.documentTypeList("category").title("Categories")),
            ]),
        ),

      S.listItem()
        .title("Services")
        .child(
          S.documentTypeList("service")
            .title("Services")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),

      S.divider(),

      S.listItem()
        .title("Course")
        .child(
          S.list()
            .title("Course")
            .items([
              S.listItem()
                .title("Courses")
                .child(S.documentTypeList("course").title("Courses")),
              S.listItem()
                .title("Chapters")
                .child(
                  S.documentTypeList("chapter")
                    .title("Chapters")
                    .defaultOrdering([{ field: "order", direction: "asc" }]),
                ),
              S.listItem()
                .title("Lessons")
                .child(
                  S.documentTypeList("module")
                    .title("Lessons")
                    .defaultOrdering([{ field: "order", direction: "asc" }]),
                ),
              S.listItem()
                .title("Assessment questions")
                .child(
                  S.documentTypeList("question").title("Assessment questions"),
                ),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title("FAQs")
        .child(
          S.documentTypeList("faq")
            .title("FAQs")
            .defaultOrdering([
              { field: "category", direction: "asc" },
              { field: "order", direction: "asc" },
            ]),
        ),

      S.listItem()
        .title("Testimonials")
        .child(
          S.documentTypeList("testimonial")
            .title("Testimonials")
            .defaultOrdering([{ field: "order", direction: "asc" }]),
        ),
    ]);
