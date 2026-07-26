import PageHeader from "../components/ui/PageHeader";
import PurchaseOrderList from "../modules/purchase-order/PurchaseOrderList";

export default function PurchaseOrderHistoryListPage() {
  return (
    <>
      <PageHeader
        title="Purchase Order History"
        description="Every purchase order and its version history."
      />

      <PurchaseOrderList />
    </>
  );
}
