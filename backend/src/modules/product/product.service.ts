import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";

function normalizeQuery(q: string): string {
  if (!q) return "";
  let normalized = q.toLowerCase().trim();
  normalized = normalized.replace(/\s+/g, " ");
  normalized = normalized.replace(/[^\w\s\-\.]/g, "");
  normalized = normalized.replace(/\s+/g, " ");
  return normalized;
}

function toTsQuery(normalized: string): string {
  if (!normalized) return "";
  const words = normalized
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 0);
  
  if (words.length === 0) return "";
  
  return words
    .map(w => w.replace(/[^\w]/g, ""))
    .filter(w => w.length > 0)
    .map(w => `${w}:*`)
    .join(" & ");
}

export class ProductService {
  static async getAll(
    page: number,
    limit: number,
    search?: string,
    stockStatus?: string,
    priceStatus?: string
  ) {
    const skip = (page - 1) * limit;

    // Build dynamic Prisma where clause
    const prismaWhere: any = {
      isActive: true,
    };

    if (stockStatus === "inStock") {
      prismaWhere.stockQty = { gt: 0 };
    } else if (stockStatus === "outOfStock") {
      prismaWhere.stockQty = { lte: 0 };
    }

    if (priceStatus === "hasPrice") {
      prismaWhere.OR = [
        { costPrice: { gt: 0 } },
        { mrp: { gt: 0 } },
      ];
    } else if (priceStatus === "noPrice") {
      prismaWhere.AND = [
        { OR: [{ costPrice: null }, { costPrice: { lte: 0 } }] },
        { OR: [{ mrp: null }, { mrp: { lte: 0 } }] },
      ];
    }

    // Build dynamic SQL where conditions
    let filterSql = "";
    if (stockStatus === "inStock") {
      filterSql += ` AND p."stockQty" > 0`;
    } else if (stockStatus === "outOfStock") {
      filterSql += ` AND p."stockQty" <= 0`;
    }

    if (priceStatus === "hasPrice") {
      filterSql += ` AND (p."costPrice" > 0 OR p.mrp > 0)`;
    } else if (priceStatus === "noPrice") {
      filterSql += ` AND (p."costPrice" IS NULL OR p."costPrice" <= 0) AND (p.mrp IS NULL OR p.mrp <= 0)`;
    }

    if (!search || !search.trim()) {
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where: prismaWhere,
          skip,
          take: limit,
          orderBy: {
            name: "asc",
          },
        }),
        prisma.product.count({
          where: prismaWhere,
        }),
      ]);

      return {
        items,
        total,
        page,
        limit,
      };
    }

    const normalized = normalizeQuery(search);
    const tsQueryStr = toTsQuery(normalized);
    const prefixPattern = `${normalized}%`;

    // Fallback if normalization results in empty string
    if (!normalized) {
      const [items, total] = await Promise.all([
        prisma.product.findMany({
          where: prismaWhere,
          skip,
          take: limit,
          orderBy: {
            name: "asc",
          },
        }),
        prisma.product.count({
          where: prismaWhere,
        }),
      ]);

      return {
        items,
        total,
        page,
        limit,
      };
    }

    const [items, countResult] = await Promise.all([
      prisma.$queryRawUnsafe(
        `
        WITH normalized_search AS (
          SELECT 
            $1::text AS query_str,
            $2::text AS prefix_pattern,
            $3::text AS ts_query_str
        )
        SELECT 
          p.id, 
          p.sku, 
          p.name, 
          p.brand, 
          p.category, 
          p."costPrice", 
          p.mrp, 
          p."stockQty", 
          p."isActive", 
          p."createdAt", 
          p."updatedAt", 
          p."tallyStockQty", 
          p."tallyUpdatedAt", 
          p.unit, 
          p."stockGroupId", 
          p."unitId", 
          p."tallyMasterId", 
          p."tallyGuid", 
          p."tallyAlterId",
          (
            -- 1. Exact SKU match (highest weight)
            (CASE WHEN LOWER(p.sku) = ns.query_str THEN 100.0 ELSE 0.0 END) +
            
            -- 2. Exact Name match
            (CASE WHEN LOWER(p.name) = ns.query_str THEN 50.0 ELSE 0.0 END) +
            
            -- 3. Prefix match on SKU
            (CASE WHEN LOWER(p.sku) LIKE ns.prefix_pattern THEN 20.0 ELSE 0.0 END) +
            
            -- 4. Prefix match on Name
            (CASE WHEN LOWER(p.name) LIKE ns.prefix_pattern THEN 10.0 ELSE 0.0 END) +
            
            -- 5. Full Text Search Rank (ts_rank_cd)
            (CASE WHEN ns.ts_query_str <> '' AND p.searchable @@ to_tsquery('simple', ns.ts_query_str) 
                  THEN ts_rank_cd(p.searchable, to_tsquery('simple', ns.ts_query_str)) * 15.0 
                  ELSE 0.0 END) +
            
            -- 6. Trigram Word Similarity
            (word_similarity(ns.query_str, p.name) * 15.0) +
            (word_similarity(ns.query_str, COALESCE(p.sku, '')) * 5.0) +
            
            -- 7. Business ranking (active before inactive)
            (CASE WHEN p."isActive" = true THEN 1.0 ELSE 0.0 END)
          ) AS score
        FROM "Product" p, normalized_search ns
        WHERE 
          p."isActive" = true
          ${filterSql}
          AND (
            p.sku ILIKE ns.prefix_pattern
            OR p.name ILIKE ns.prefix_pattern
            OR (ns.ts_query_str <> '' AND p.searchable @@ to_tsquery('simple', ns.ts_query_str))
            OR word_similarity(ns.query_str, p.name) > 0.15
            OR word_similarity(ns.query_str, COALESCE(p.sku, '')) > 0.15
          )
        ORDER BY score DESC, p.name ASC
        LIMIT $4 OFFSET $5;
        `,
        normalized,
        prefixPattern,
        tsQueryStr,
        limit,
        skip
      ) as Promise<any[]>,
      prisma.$queryRawUnsafe(
        `
        WITH normalized_search AS (
          SELECT 
            $1::text AS query_str,
            $2::text AS prefix_pattern,
            $3::text AS ts_query_str
        )
        SELECT COUNT(*) as count
        FROM "Product" p, normalized_search ns
        WHERE 
          p."isActive" = true
          ${filterSql}
          AND (
            p.sku ILIKE ns.prefix_pattern
            OR p.name ILIKE ns.prefix_pattern
            OR (ns.ts_query_str <> '' AND p.searchable @@ to_tsquery('simple', ns.ts_query_str))
            OR word_similarity(ns.query_str, p.name) > 0.15
            OR word_similarity(ns.query_str, COALESCE(p.sku, '')) > 0.15
          );
        `,
        normalized,
        prefixPattern,
        tsQueryStr
      ) as Promise<Array<{ count: bigint }>>
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  static async create(data: {
    sku: string;
    name: string;
    brand?: string;
    category?: string;
    unit?: string;
    costPrice?: number | null;
    mrp?: number | null;
    stockQty: number;
  }) {
    const exists = await prisma.product.findUnique({
      where: {
        sku: data.sku,
      },
    });

    if (exists) {
      throw new AppError("SKU already exists", 409);
    }

    return prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        brand: data.brand,
        category: data.category,
        unit: data.unit,
        costPrice: data.costPrice ?? null,
        mrp: data.mrp ?? null,
        stockQty: data.stockQty,
      },
    });
  }

  static async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: {
        id,
        isActive: true,
      },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  }

  static async update(
    id: string,
    data: {
      sku?: string;
      name?: string;
      brand?: string | null;
      category?: string | null;
      unit?: string | null;
      costPrice?: number | null;
      mrp?: number | null;
      stockQty?: number;
    },
  ) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  static async deactivate(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return prisma.product.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}
