import { useState } from "react";

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

import type { Customer } from "./customer.types";

export default function CustomerList() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useCustomers(1, search);

  return (
    <div>
      <PageHeader title="Customers" />

      <div className="mb-4">
        <Input
          placeholder="Search customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
              <TableCell>Loading...</TableCell>
            </TableRow>
          )}

          {data?.items?.map((customer: Customer) => (
            <TableRow key={customer.id}>
              <TableCell>{customer.name}</TableCell>

              <TableCell>{customer.mobile}</TableCell>

              <TableCell>{customer.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
