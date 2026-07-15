import { useState, useEffect, useMemo } from "react";
import { useFuzzySearch } from "./useFuzzySearch";
import type { Product } from "../modules/product/product.types";

export type DropdownItem =
  | { type: "recent"; query: string }
  | { type: "product"; product: Product };

interface UseProductDropdownSearchOptions {
  products: Product[];
  searchVal: string;
  setSearchVal: (val: string) => void;
  onSelectProduct: (product: Product) => void;
  onCloseDropdown: () => void;
}

export function useProductDropdownSearch({
  products,
  searchVal,
  setSearchVal,
  onSelectProduct,
  onCloseDropdown,
}: UseProductDropdownSearchOptions) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Load recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("recent_product_searches");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Debounce input to prevent unnecessary fuzzy search processing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Sync internal query with parent searchVal if searchVal is empty (e.g. reset)
  useEffect(() => {
    if (searchVal === "") {
      setQuery("");
    }
  }, [searchVal]);

  const customRankProduct = (product: Product, q: string, _fuseScore: number) => {
    if (!q) return 999;
    const qLower = q.toLowerCase();
    const name = product.name.toLowerCase();
    const sku = (product.sku || "").toLowerCase();
    const brand = (product.brand || "").toLowerCase();
    const category = (product.category || "").toLowerCase();

    // Priority 1: Exact SKU match
    if (sku === qLower) return 1;
    // Priority 2: Exact Name match
    if (name === qLower) return 2;
    // Priority 3: Product name starting with search text
    if (name.startsWith(qLower)) return 3;
    // Priority 4: Product name containing search text
    if (name.includes(qLower)) return 4;
    // Priority 5: Brand/category matches
    if (brand.startsWith(qLower) || brand.includes(qLower) || category.startsWith(qLower) || category.includes(qLower)) return 5;
    // Priority 6: Fuzzy typo matches
    return 6;
  };

  // Perform fuzzy search
  const { results: searchedProducts } = useFuzzySearch({
    items: products,
    keys: ["name", "sku", "brand", "category"],
    searchQuery: debouncedQuery,
    customRankFn: customRankProduct,
  });

  // Generate combined dropdown options
  const dropdownItems = useMemo<DropdownItem[]>(() => {
    if (!query.trim()) {
      if (recentSearches.length > 0) {
        return recentSearches.map((term) => ({ type: "recent", query: term }));
      }
      return products.slice(0, 20).map((p) => ({ type: "product", product: p }));
    }
    return searchedProducts.slice(0, 30).map((p) => ({ type: "product", product: p }));
  }, [query, recentSearches, products, searchedProducts]);

  // Reset selected index when the items list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [dropdownItems.length]);

  const addRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((t) => t !== trimmed);
      const next = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem("recent_product_searches", JSON.stringify(next));
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent_product_searches");
  };

  const removeRecentSearch = (term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((t) => t !== term);
      localStorage.setItem("recent_product_searches", JSON.stringify(next));
      return next;
    });
  };

  const selectProduct = (product: Product) => {
    // Add current search query to recent searches
    if (query.trim()) {
      addRecentSearch(query);
    }
    onSelectProduct(product);
    setQuery("");
  };

  const handleRecentSearchSelect = (term: string) => {
    setQuery(term);
    setSearchVal(term);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, dropdownItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const activeItem = dropdownItems[selectedIndex];
      if (activeItem) {
        if (activeItem.type === "product") {
          selectProduct(activeItem.product);
        } else if (activeItem.type === "recent") {
          handleRecentSearchSelect(activeItem.query);
        }
      }
    } else if (e.key === "Escape") {
      onCloseDropdown();
    }
  };

  const handleInputChange = (val: string) => {
    setQuery(val);
    setSearchVal(val);
  };

  return {
    query,
    dropdownItems,
    selectedIndex,
    setSelectedIndex,
    recentSearches,
    clearRecentSearches,
    removeRecentSearch,
    handleInputChange,
    handleKeyDown,
    selectProduct,
    handleRecentSearchSelect,
  };
}
