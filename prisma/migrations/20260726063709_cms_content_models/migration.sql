-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "summary" TEXT,
ALTER COLUMN "sanityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "courseFaqs" JSONB,
ADD COLUMN     "coverImageKey" TEXT,
ADD COLUMN     "description" JSONB,
ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT,
ADD COLUMN     "summary" TEXT,
ALTER COLUMN "sanityId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "notes" JSONB,
ALTER COLUMN "sanityId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "chapterId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "topic" TEXT NOT NULL,
    "explanation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogCategory" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPost" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "body" JSONB NOT NULL,
    "coverImageKey" TEXT,
    "coverImageAlt" TEXT,
    "categoryId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedHubAnchors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "whoItIsFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whatIsCovered" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "format" TEXT,
    "body" JSONB,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoshSection" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "title" TEXT NOT NULL,
    "anchor" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "isFaq" BOOLEAN NOT NULL DEFAULT false,
    "body" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoshSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickReference" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "title" TEXT NOT NULL,
    "anchor" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "intro" TEXT,
    "body" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "question" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "quote" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "organization" TEXT,
    "consentOnFile" BOOLEAN NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "imageKey" TEXT NOT NULL,
    "imageAlt" TEXT,
    "permalink" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CtaBand" (
    "id" TEXT NOT NULL,
    "sanityId" TEXT,
    "heading" TEXT NOT NULL,
    "body" TEXT,
    "buttonLabel" TEXT NOT NULL,
    "buttonHref" TEXT NOT NULL,
    "afterGroup" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CtaBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettingsRow" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "businessName" TEXT NOT NULL DEFAULT 'JS Workplace Wellness',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT,
    "whatsappNumber" TEXT,
    "whatsappDefaultMessage" TEXT,
    "addressLines" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "linkedinUrl" TEXT,
    "instagramUrl" TEXT,
    "youtubeUrl" TEXT,
    "announcementEnabled" BOOLEAN NOT NULL DEFAULT false,
    "announcementText" TEXT,
    "announcementHref" TEXT,
    "heroHeading" TEXT,
    "heroSubheading" TEXT,
    "heroPrimaryCtaLabel" TEXT,
    "heroPrimaryCtaHref" TEXT,
    "legalEntityName" TEXT,
    "gstin" TEXT,
    "supportEmail" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettingsRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_sanityId_key" ON "Question"("sanityId");

-- CreateIndex
CREATE INDEX "Question_chapterId_isActive_idx" ON "Question"("chapterId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_sanityId_key" ON "BlogCategory"("sanityId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_sanityId_key" ON "BlogPost"("sanityId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");

-- CreateIndex
CREATE INDEX "BlogPost_isPublished_publishedAt_idx" ON "BlogPost"("isPublished", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Service_sanityId_key" ON "Service"("sanityId");

-- CreateIndex
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- CreateIndex
CREATE INDEX "Service_isPublished_order_idx" ON "Service"("isPublished", "order");

-- CreateIndex
CREATE UNIQUE INDEX "PoshSection_sanityId_key" ON "PoshSection"("sanityId");

-- CreateIndex
CREATE UNIQUE INDEX "PoshSection_anchor_key" ON "PoshSection"("anchor");

-- CreateIndex
CREATE INDEX "PoshSection_group_order_idx" ON "PoshSection"("group", "order");

-- CreateIndex
CREATE UNIQUE INDEX "QuickReference_sanityId_key" ON "QuickReference"("sanityId");

-- CreateIndex
CREATE UNIQUE INDEX "QuickReference_anchor_key" ON "QuickReference"("anchor");

-- CreateIndex
CREATE UNIQUE INDEX "Faq_sanityId_key" ON "Faq"("sanityId");

-- CreateIndex
CREATE INDEX "Faq_category_order_idx" ON "Faq"("category", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Testimonial_sanityId_key" ON "Testimonial"("sanityId");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramPost_sanityId_key" ON "InstagramPost"("sanityId");

-- CreateIndex
CREATE UNIQUE INDEX "CtaBand_sanityId_key" ON "CtaBand"("sanityId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
