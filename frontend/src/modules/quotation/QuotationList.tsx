import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, GitBranch, Search } from "lucide-react";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { useQuotations } from "./quotation.query";
import type { QuotationListItem } from "./quotation.types";

const PAGE_SIZE = 20;

const STATUS_BADGE_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SENT: "bg-blue-100 text-blue-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  EXPIRED: "bg-amber-100 text-amber-700",
};

/** Who the quotation is for — lead, customer, or a walk-in with no record. */
const targetName = (quotation: QuotationListItem) =>
  quotation.customer?.name ??
  quotation.lead?.name ??
  quotation.walkInName ??
  "—";

export default function QuotationList() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const { data, isLoading } = useQuotations(page, PAGE_SIZE);

  const items: QuotationListItem[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // The list endpoint has no search/status params, so filter the page we have.
  // Anything beyond the current page won't be matched — see the note below.
  const term = search.trim().toLowerCase();
  const visible = items.filter((quotation) => {
    const matchesStatus = status === "ALL" || quotation.status === status;
    const matchesTerm =
      !term ||
      quotation.quotationNumber.toLowerCase().includes(term) ||
      targetName(quotation).toLowerCase().includes(term);

    return matchesStatus && matchesTerm;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-3.5 text-muted-foreground"
          />
          <Input
            placeholder="Search this page by quotation number or customer..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-44 h-10 text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-14">
            <FileText size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-900">
              No quotations found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {total === 0
                ? "Create your first quotation to get started."
                : "No quotations on this page match your filters."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quotation</TableHead>
                <TableHead>Customer / Lead</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">History</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {visible.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-gray-900">
                        {quotation.quotationNumber}
                      </span>
                      <span className="text-[10px] text-muted-foreground bg-gray-50 border px-1.5 py-0.5 rounded font-mono">
                        v{quotation.version}
                      </span>
                      {quotation.parentQuotationId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-700">
                          revised
                        </span>
                      )}
                    </div>
                    {quotation.phase && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {quotation.phase}
                      </p>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-gray-900">
                      {targetName(quotation)}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {quotation.type.replace(/_/g, " ")}
                    </p>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {quotation.project?.projectName ?? "—"}
                  </TableCell>

                  <TableCell>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        STATUS_BADGE_STYLE[quotation.status] ??
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {quotation.status}
                    </span>
                  </TableCell>

                  <TableCell className="text-right text-xs font-bold text-gray-900">
                    ₹{Number(quotation.totalAmount).toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell className="text-[10px] text-muted-foreground">
                    {new Date(quotation.createdAt).toLocaleDateString([], {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigate(`/quotations/${quotation.id}/history`)
                      }
                    >
                      <GitBranch size={14} />
                      History
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total} quotation{total === 1 ? "" : "s"} · page {page} of {totalPages}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
