import { QuotationType } from "@prisma/client";

export interface CreateQuotationDTO {
  type?: QuotationType;
  leadId?: string;
  customerId?: string;
  projectId?: string;

  phase?: string | null;

  walkInName?: string;
  walkInMobile?: string;
  walkInEmail?: string | null;
  walkInAddress?: string | null;

  notes?: string;

  validUntil?: Date;

  items: {
    productId: string;
    quantity: number;
    marginPercent: number;
  }[];
}
