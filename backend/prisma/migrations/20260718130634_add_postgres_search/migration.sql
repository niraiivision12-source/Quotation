-- CreateExtensionIfNotExist
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- CreateImmutableUnaccent
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
  SELECT public.unaccent('public.unaccent', $1);
$$ LANGUAGE sql IMMUTABLE;

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN "searchable" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(name, ''))), 'A') ||
  setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(sku, ''))), 'A') ||
  setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(brand, ''))), 'B') ||
  setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(category, ''))), 'B')
) STORED;

-- CreateIndex
CREATE INDEX "Product_searchable_idx" ON "public"."Product" USING gin("searchable");
CREATE INDEX "Product_name_trgm_idx" ON "public"."Product" USING gin("name" gin_trgm_ops);
CREATE INDEX "Product_sku_trgm_idx" ON "public"."Product" USING gin("sku" gin_trgm_ops);
