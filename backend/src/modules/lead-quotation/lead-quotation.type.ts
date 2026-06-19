import { ProjectPhase } from "@prisma/client";

export interface CreateLeadQuotationDTO {
  leadId: string;

  phase?: ProjectPhase;

  notes?: string;

  items: {
    productId: string;
    quantity: number;
    sellingPrice: number;
  }[];
}
