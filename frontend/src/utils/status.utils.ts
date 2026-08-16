export function formatStatus(status: string): string {
  if (!status) return "";
  const upper = status.toUpperCase();
  if (upper === "NEGOTIATION") return "Follow-up";
  if (upper === "TRIAGED") return "Assigned";
  return status.replace(/_/g, " ");
}
