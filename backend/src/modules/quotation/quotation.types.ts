export interface CreateQuotationDTO {
  leadId?: string;
  customerId?: string;
  projectId?: string;

  phase?: string;

  notes?: string;

  validUntil?: Date;

  items: {
    productId: string;
    quantity: number;
    marginPercent: number;
  }[];
}
