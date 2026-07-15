import { useMemo } from "react";
import Fuse from "fuse.js";
import type { IFuseOptions } from "fuse.js";

interface UseFuzzySearchOptions<T> {
  items: T[];
  keys: string[];
  searchQuery: string;
  page?: number;
  limit?: number;
  fuseOptions?: IFuseOptions<T>;
  customRankFn?: (item: T, query: string, fuseScore: number) => number;
}

const getNestedValue = (obj: any, path: string): string => {
  if (!obj || !path) return "";
  if (!path.includes(".")) {
    const val = obj[path];
    return val !== undefined && val !== null ? String(val) : "";
  }
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return "";
    current = current[part];
  }
  return current !== undefined && current !== null ? String(current) : "";
};

export function useFuzzySearch<T>({
  items,
  keys,
  searchQuery,
  page,
  limit,
  fuseOptions,
  customRankFn,
}: UseFuzzySearchOptions<T>) {
  const serializedKeys = useMemo(() => keys.join(","), [keys]);

  // Generates a signature of only the searchable fields across all items.
  // This ensures the Fuse index is NOT rebuilt when transactional fields
  // (like price, stockQty, tax) change in the parent application state.
  const searchableSignature = useMemo(() => {
    const fieldsArray = serializedKeys.split(",");
    return items
      .map((item: any) => {
        const id = item.id || "";
        const fieldValues = fieldsArray.map((key) => getNestedValue(item, key)).join(",");
        return `${id}:${fieldValues}`;
      })
      .join("|");
  }, [items, serializedKeys]);

  // Build/reuse Fuse index only when searchable fields or keys change
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys,
      threshold: 0.3,
      includeScore: true,
      ignoreLocation: true,
      ...fuseOptions,
    });
  }, [searchableSignature, serializedKeys, fuseOptions]);

  // Perform search and sort by custom rank + Fuse score
  const processedResults = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      return items;
    }

    const searchResults = fuse.search(trimmedQuery);

    let mapped = searchResults.map((res) => ({
      item: res.item,
      score: res.score ?? 1,
    }));

    if (customRankFn) {
      mapped = mapped.map((res) => {
        const rank = customRankFn(res.item, trimmedQuery, res.score);
        return {
          ...res,
          rank,
        };
      });

      mapped.sort((a: any, b: any) => {
        // Sort by rank category (lower is better: 1 to 6)
        if (a.rank !== b.rank) {
          return a.rank - b.rank;
        }
        // Tie-breaker: Fuse.js score (lower is better)
        if (a.score !== b.score) {
          return a.score - b.score;
        }
        // Alphabetical fallback
        const nameA = (a.item as any).name || (a.item as any).projectName || (a.item as any).title || (a.item as any).quotationNumber || "";
        const nameB = (b.item as any).name || (b.item as any).projectName || (b.item as any).title || (b.item as any).quotationNumber || "";
        return nameA.localeCompare(nameB);
      });
    } else {
      mapped.sort((a, b) => a.score - b.score);
    }

    return mapped.map((r) => r.item);
  }, [items, searchQuery, fuse, customRankFn]);

  // Client-side pagination (optional)
  const paginatedResults = useMemo(() => {
    if (page === undefined || limit === undefined) {
      return processedResults;
    }
    const skip = (page - 1) * limit;
    return processedResults.slice(skip, skip + limit);
  }, [processedResults, page, limit]);

  return {
    results: paginatedResults,
    total: processedResults.length,
    totalPages: limit ? Math.max(1, Math.ceil(processedResults.length / limit)) : 1,
  };
}
