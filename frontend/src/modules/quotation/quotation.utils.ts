import { generateUUID } from "../../utils/uuid.utils";
import type { QuotationItemForm } from "./quotation.types";

export function calculateSellingPrice(
  costPrice: number,
  marginPercent: number,
) {
  if (marginPercent >= 100) return 0; // Prevent division by zero / negative prices
  return costPrice / (1 - marginPercent / 100);
}

export function calculateSellingPriceFromMRP(
  mrp: number,
  discountPercent: number,
) {
  return mrp - (mrp * discountPercent) / 100;
}

export function calculateTotal(sellingPrice: number, quantity: number) {
  return sellingPrice * quantity;
}

export function createEmptyQuotationRow(): QuotationItemForm {
  return {
    id: generateUUID(),

    quantity: 1,

    costPrice: 0,

    marginPercent: 0,

    mrp: 0,

    discountPercent: 0,

    gstPercent: 18,

    isManualPrice: false,

    sellingPrice: 0,

    totalPrice: 0,

    search: "",

    showDropdown: false,
  };
}
