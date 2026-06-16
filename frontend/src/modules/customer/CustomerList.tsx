import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PageHeader from "@/components/ui/PageHeader";
import { Link } from "react-router-dom";
import CreateCustomerDialog from "./CreateCustomerDialog";
import { useCustomers } from "./customer.query";

export default function CustomerList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useCustomers(page, search);

  return (
    <div>
      <PageHeader title="Customers" />

      <div className="mb-4">
        <CreateCustomerDialog />
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search customer"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Contact Owner</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Referral Date</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={7}>Loading...</TableCell>
            </TableRow>
          )}

          {!isLoading && data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={7}>No customers found.</TableCell>
            </TableRow>
          )}

          {data?.items.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <Link to={`/customers/${customer.id}`}>{customer.name}</Link>
              </TableCell>
              <TableCell>{customer.mobile}</TableCell>
              <TableCell>{customer.city ?? "-"}</TableCell>
              <TableCell>{customer.source ?? "-"}</TableCell>
              <TableCell>{customer.contactOwner?.name ?? "-"}</TableCell>
              <TableCell>{customer.notes ?? "-"}</TableCell>
              <TableCell>
                {customer.referralDate
                  ? new Date(customer.referralDate).toLocaleDateString()
                  : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-2 mt-4">
        <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button
          disabled={!data || page * 20 >= data.total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
