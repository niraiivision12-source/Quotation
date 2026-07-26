import { useRef } from "react";
import { Badge } from "../../components/ui/badge";
import { Calendar, Clock, DollarSign, Loader2, User } from "lucide-react";
import { useOpportunitiesByStatus } from "./opportunity.query";
import type { OpportunityStatus, ProductCategory } from "./opportunity.types";

interface PipelineColumnProps {
  category: ProductCategory;
  status: OpportunityStatus;
  title: string;
  colorClass: string;
  count?: number;
  search: string;
  isEditable: boolean;
  onDragStartOpp: (e: React.DragEvent, opp: any) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetStatus: OpportunityStatus) => void;
  formatDate: (dateStr?: string | null) => string;
  isOverdue: (dateStr?: string | null) => boolean;
  getSalesmanName: (id?: string | null) => string;
}

export default function PipelineColumn({
  category,
  status,
  title,
  colorClass,
  count,
  search,
  isEditable,
  onDragStartOpp,
  onDragOver,
  onDrop,
  formatDate,
  isOverdue,
  getSalesmanName,
}: PipelineColumnProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useOpportunitiesByStatus(category, status, search);

  const scrollRef = useRef<HTMLDivElement>(null);
  const items = data?.pages.flatMap((p) => p.items) || [];
  const total = data?.pages[0]?.total ?? count ?? items.length;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || isFetchingNextPage || !hasNextPage) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) fetchNextPage();
  };

  return (
    <div
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status)}
      className={`flex-1 min-w-[250px] max-w-[320px] rounded-xl flex flex-col h-full border border-slate-200/50 bg-slate-50/50 p-3 ${colorClass}`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="font-bold text-slate-800 text-sm">{title}</span>
        <Badge variant="secondary" className="bg-slate-200/60 text-slate-700 font-semibold px-2 py-0.5 text-xs">
          {total}
        </Badge>
      </div>

      {/* Column Cards content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1"
      >
        {isLoading ? (
          <div className="text-center text-xs text-slate-400 py-6">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-[11px] text-slate-400 py-8 border border-dashed border-slate-200 rounded-lg bg-white/20">
            Drag items here
          </div>
        ) : (
          <>
            {items.map((opp: any) => (
              <div
                key={opp.id}
                draggable={isEditable}
                onDragStart={(e) => onDragStartOpp(e, opp)}
                className={`bg-white border border-slate-200/60 rounded-lg p-2.5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-1 relative ${
                  isEditable ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-90"
                }`}
              >
                {/* Overdue Alert banner */}
                {isOverdue(opp.nextFollowUpAt) && status !== "WON" && status !== "LOST" && (
                  <div className="absolute top-1.5 right-1.5 text-red-500" title="Overdue Follow-up!">
                    <Clock size={12} className="animate-pulse" />
                  </div>
                )}

                <div className="flex flex-col pr-4">
                  <h4 className="font-bold text-slate-800 text-xs line-clamp-1">
                    {opp.customer?.name || "Unknown Customer"}
                  </h4>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {opp.category} Opportunity
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-100">
                  {status !== "NEW" && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={10} className="text-slate-400" />
                      <span className="font-semibold text-slate-700">
                        {opp.estimatedValue ? `₹${Number(opp.estimatedValue).toLocaleString()}` : "₹0"}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Calendar size={11} className="text-slate-400" />
                    <span
                      className={
                        isOverdue(opp.nextFollowUpAt) && status !== "WON" && status !== "LOST"
                          ? "text-red-500 font-bold"
                          : "text-slate-500"
                      }
                    >
                      {formatDate(opp.nextFollowUpAt)}
                    </span>
                  </div>
                </div>

                {/* Salesperson display */}
                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                  <User size={10} />
                  <span>Salesman: {getSalesmanName(opp.assignedToId)}</span>
                </div>

                {/* Lost Reason if present */}
                {opp.status === "LOST" && opp.lostReason && (
                  <div className="mt-0.5 bg-red-50 text-red-700 text-[9px] rounded p-1 border border-red-100 italic">
                    Reason: {opp.lostReason}
                  </div>
                )}
              </div>
            ))}

            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-3">
                <Loader2 size={12} className="animate-spin" /> Loading more...
              </div>
            )}

            {!isFetchingNextPage && hasNextPage && (
              <button
                onClick={() => fetchNextPage()}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold py-2 hover:bg-blue-50/50 rounded-lg transition-colors"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
