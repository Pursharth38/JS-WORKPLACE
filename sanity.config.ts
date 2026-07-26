"use client";

/**
 * Sanity Studio, mounted at /studio inside the Next app.
 *
 * ⚠️ /studio is EXCLUDED from the auth middleware matcher (see proxy.ts).
 * Sanity handles its own authentication — putting our session check in front of
 * it would lock the client out of her own CMS.
 */
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { apiVersion, dataset, projectId } from "./sanity/env";
import { deskStructure } from "./sanity/desk-structure";
import { schemaTypes } from "./sanity/schemas";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  title: "JS Workplace Wellness",
  schema: { types: schemaTypes },
  plugins: [
    structureTool({ structure: deskStructure }),
    // Vision is the GROQ playground. Useful for us, harmless for the client —
    // it is read-only and sits behind Sanity's own auth.
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
