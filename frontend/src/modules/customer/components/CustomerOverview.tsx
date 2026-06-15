import { Card, CardContent } from "@/components/ui/Card";

interface Props {
  customer: {
    mobile: string;
    email?: string;
  };
}

export default function CustomerOverview({ customer }: Props) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div>Mobile: {customer.mobile}</div>

        <div>Email: {customer.email || "-"}</div>
      </CardContent>
    </Card>
  );
}
