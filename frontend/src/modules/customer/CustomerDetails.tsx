import { useParams } from "react-router-dom";

import PageHeader from "@/components/ui/PageHeader";

import CustomerOverview from "./components/CustomerOverview";
import CustomerProjects from "./components/CustomerProjects";
import { useCustomer } from "./customer.query";

export default function CustomerDetails() {
  const { id } = useParams();

  const { data } = useCustomer(id || "");

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <PageHeader title={data.name} />

      <CustomerOverview customer={data} />

      <CustomerProjects projects={data.projects} />
    </div>
  );
}
