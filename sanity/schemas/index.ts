import type { SchemaTypeDefinition } from "sanity";

import chapter from "./chapter";
import course from "./course";
import faq from "./faq";
import module from "./module";
import { calloutBox, ctaBand, dataTable } from "./objects";
import poshSection from "./poshSection";
import post, { category } from "./post";
import question from "./question";
import quickReference from "./quickReference";
import service from "./service";
import siteSettings from "./siteSettings";
import testimonial from "./testimonial";

export const schemaTypes: SchemaTypeDefinition[] = [
  // Reusable content blocks — must be registered before the documents using them
  calloutBox,
  dataTable,
  ctaBand,

  // Course structure (mirrored into Postgres by /api/webhooks/sanity)
  course,
  chapter,
  module,
  question,

  // Marketing + content
  poshSection,
  quickReference,
  post,
  category,
  service,
  faq,
  testimonial,
  siteSettings,
];
