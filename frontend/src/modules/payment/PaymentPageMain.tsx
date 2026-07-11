import PageHeader from "../../components/ui/PageHeader";
import PaymentList from "./components/PaymentList";

export default function PaymentPageMain() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payment Management" />
      <PaymentList />
    </div>
  );
}
