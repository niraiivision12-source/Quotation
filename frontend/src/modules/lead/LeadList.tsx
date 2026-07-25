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
import { useOpportunities } from "../opportunity/opportunity.query";
import type { Opportunity } from "../opportunity/opportunity.types";

interface LeadRow {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  city: string | null;
  source: string | null;
  status: LeadStatus;
  category: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
  origin: "LEAD" | "ENQUIRY";
}

function leadToRow(lead: Lead): LeadRow {
  return {
    id: lead.id,
    name: lead.name,
    mobile: lead.mobile,
    email: lead.email ?? null,
    city: lead.city ?? null,
    source: lead.source ?? null,
    status: lead.status,
    category: null,
    assignedTo: lead.assignedTo ?? null,
    createdAt: lead.createdAt,
    origin: "LEAD",
  };
}

function opportunityToRow(opportunity: Opportunity): LeadRow {
  return {
    id: opportunity.id,
    name: opportunity.customer?.name ?? "-",
    mobile: opportunity.customer?.mobile ?? "-",
    email: opportunity.customer?.email ?? null,
    city: opportunity.customer?.city ?? null,
    source: opportunity.source ?? null,
    status: opportunity.status,
    category: opportunity.category,
    assignedTo: opportunity.assignedTo ?? null,
    createdAt: opportunity.createdAt,
    origin: "ENQUIRY",
  };
}

export default function LeadList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading: isLoadingLeads } = useAllLeads();
  const { data: opportunitiesData, isLoading: isLoadingOpportunities } = useOpportunities(
    1,
    "",
    undefined,
    10000
  );
  const isLoading = isLoadingLeads || isLoadingOpportunities;

  const leadRows = (data?.items ?? []).map(leadToRow);
  const opportunityRows = (opportunitiesData?.items ?? []).map(opportunityToRow);
  const rows = [...leadRows, ...opportunityRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const { results: visibleLeads, totalPages } = useFuzzySearch({
    items: rows,
    keys: ["name", "mobile", "email", "city"],
    searchQuery: search,
    page,
    limit: 20,
    customRankFn: (row: LeadRow, q) => {
      const qLower = q.toLowerCase();
      const name = row.name.toLowerCase();
      const mobile = (row.mobile || "").toLowerCase();
      const email = (row.email || "").toLowerCase();

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
            <TableHead>Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={9}>Loading...</TableCell>
            </TableRow>
          )}

          {!isLoading && visibleLeads.length === 0 && (
            <TableRow>
              <TableCell colSpan={9}>No leads found.</TableCell>
            </TableRow>
          )}

          {visibleLeads.map((lead) => (
            <TableRow key={`${lead.origin}-${lead.id}`}>
              <TableCell>
                <Badge
                  className={
                    lead.origin === "LEAD"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }
                >
                  {lead.origin === "LEAD" ? "Lead" : "Enquiry"}
                </Badge>
              </TableCell>

              <TableCell>
                {lead.origin === "LEAD" ? (
                  <Link to={`/leads/${lead.id}`} className="text-blue-600 hover:underline">
                    {highlightText(lead.name, search)}
                  </Link>
                ) : (
                  highlightText(lead.name, search)
                )}
              </TableCell>

              <TableCell>{highlightText(lead.mobile, search)}</TableCell>

              <TableCell>{lead.email ? highlightText(lead.email, search) : "-"}</TableCell>

              <TableCell>{lead.city ? highlightText(lead.city, search) : "-"}</TableCell>

              <TableCell>{lead.category ? lead.category.replace(/_/g, " ") : "-"}</TableCell>

              <TableCell>{lead.source || "-"}</TableCell>

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
