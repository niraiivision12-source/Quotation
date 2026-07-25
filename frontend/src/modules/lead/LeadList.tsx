import { useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import PageHeader from "../../components/ui/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";

import { useFuzzySearch } from "../../hooks/useFuzzySearch";
import { highlightText } from "../../utils/highlight.utils";

import { useAllLeads } from "./lead.query";
import type { Lead, LeadStatus } from "./lead.types";

const STATUS_STYLES: Record<LeadStatus, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  NOT_RESPONDING: "bg-gray-100 text-gray-700",
  QUOTATION_SENT: "bg-purple-100 text-purple-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
};

export default function LeadList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useAllLeads();
  const leads = data?.items ?? [];

  const { results: visibleLeads, totalPages } = useFuzzySearch({
    items: leads,
    keys: ["name", "mobile", "email", "city"],
    searchQuery: search,
    page,
    limit: 20,
    customRankFn: (lead: Lead, q) => {
      const qLower = q.toLowerCase();
      const name = lead.name.toLowerCase();
      const mobile = (lead.mobile || "").toLowerCase();
      const email = (lead.email || "").toLowerCase();

      if (mobile === qLower) return 1;
      if (name === qLower) return 2;
      if (name.startsWith(qLower)) return 3;
      if (name.includes(qLower)) return 4;
      if (email.includes(qLower)) return 5;
      return 6;
    },
  });

  return (
    <div>
      <PageHeader title="Leads" description="All leads captured across sources" />

      <div className="mb-4">
        <Input
          placeholder="Search leads by name, mobile, email or city"
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
            <TableHead>Email</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={8}>Loading...</TableCell>
            </TableRow>
          )}

          {!isLoading && visibleLeads.length === 0 && (
            <TableRow>
              <TableCell colSpan={8}>No leads found.</TableCell>
            </TableRow>
          )}

          {visibleLeads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <Link to={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                  {highlightText(lead.name, search)}
                </Link>
              </TableCell>

              <TableCell>{highlightText(lead.mobile, search)}</TableCell>

              <TableCell>{lead.email ? highlightText(lead.email, search) : "-"}</TableCell>

              <TableCell>{lead.city ? highlightText(lead.city, search) : "-"}</TableCell>

              <TableCell>{lead.source || "-"}</TableCell>

              <TableCell>
                <Badge className={STATUS_STYLES[lead.status]}>
                  {lead.status.replace(/_/g, " ")}
                </Badge>
              </TableCell>

              <TableCell>{lead.assignedTo?.name || "-"}</TableCell>

              <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex gap-2 mt-4">
        <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Previous
        </Button>
        <Button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
