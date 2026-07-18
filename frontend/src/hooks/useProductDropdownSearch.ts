import { useState, useEffect, useMemo } from "react";
import type { Product } from "../modules/product/product.types";
import { useProducts } from "../modules/product/product.query";

export type DropdownItem =
  | { type: "recent"; query: string }
  | { type: "product"; product: Product };

interface UseProductDropdownSearchOptions {
  searchVal: string;
  setSearchVal: (val: string) => void;
  onSelectProduct: (product: Product) => void;
  onCloseDropdown: () => void;
}

export function useProductDropdownSearch({
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

  // Debounce input to prevent excessive backend queries
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

  // Perform backend database search
  const { data: searchResults, isLoading } = useProducts(debouncedQuery);
  const searchedProducts = searchResults?.items ?? [];

  // Generate combined dropdown options
  const dropdownItems = useMemo<DropdownItem[]>(() => {
    if (!query.trim()) {
      if (recentSearches.length > 0) {
        return recentSearches.map((term) => ({ type: "recent", query: term }));
      }
      return searchedProducts.slice(0, 20).map((p) => ({ type: "product", product: p }));
    }
    return searchedProducts.slice(0, 30).map((p) => ({ type: "product", product: p }));
  }, [query, recentSearches, searchedProducts]);

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
    isLoading,
  };
}
