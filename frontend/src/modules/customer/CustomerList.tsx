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

import { useCustomers } from "./customer.query";

import CustomerForm from "./CustomerForm";

import { Card, CardContent } from "@/components/ui/card";

export default function CustomerList() {
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const { data, isLoading } = useCustomers(page, search);

  return (
    <div>
      <PageHeader title="Customers" />

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

      <Card className="mb-6">
        <CardContent className="pt-6">
          <CustomerForm />
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>

            <TableHead>Mobile</TableHead>

            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={3}>Loading...</TableCell>
            </TableRow>
          )}

          {data?.items.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.name}</TableCell>

              <TableCell>{customer.mobile}</TableCell>

              <TableCell>{customer.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-2 mt-4">
        <Button
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Previous
        </Button>

        <Button onClick={() => setPage((prev) => prev + 1)}>Next</Button>
      </div>
    </div>
  );
}
