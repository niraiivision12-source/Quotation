import PageHeader from "../components/ui/PageHeader";
import QuotationList from "../modules/quotation/QuotationList";

export default function QuotationHistoryListPage() {
  return (
    <>
      <PageHeader
        title="Quotation History"
        description="Every quotation and its revision history."
      />

      <QuotationList />
    </>
  );
}
