import { generateUUID } from "../../utils/uuid.utils";
import type { QuotationItemForm } from "./quotation.types";

export function calculateSellingPrice(
  costPrice: number,
  marginPercent: number,
) {
  return costPrice + (costPrice * marginPercent) / 100;
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

    sellingPrice: 0,

    totalPrice: 0,

    search: "",

    showDropdown: false,
  };
}
