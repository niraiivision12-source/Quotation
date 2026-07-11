import {
  CheckCircle,
  Circle,
  Clock,
  ListTodo,
  MoreVertical,
  Pencil,
  XCircle,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import PageHeader from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import { useUsers } from "../user/user.query";
import TaskForm from "./TaskForm";
import EditTaskForm from "./EditTaskForm";
import type { Task } from "./task.types";
import {
  useCancelTask,
  useCompleteTask,
  useTasks,
  useDeleteTask,
} from "./task.query";

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function isOverdue(task: Task) {
  if (!task.dueAt) return false;
  if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;
  return new Date(task.dueAt) < new Date();
}

function formatDue(dueAt: string) {
  const date = new Date(dueAt);
  return date.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function LinkedTo({ task }: { task: Task }) {
  if (task.lead) {
    return (
      <Link to={`/leads/${task.lead.id}`} className="text-xs text-blue-600 hover:underline">
        Lead: {task.lead.name}
      </Link>
    );
  }
  if (task.customer) {
    return (
      <Link to={`/customers/${task.customer.id}`} className="text-xs text-blue-600 hover:underline">
        Customer: {task.customer.name}
      </Link>
    );
  }
  if (task.project) {
    return (
      <Link to={`/projects/${task.project.id}`} className="text-xs text-blue-600 hover:underline">
        Project: {task.project.projectName}
      </Link>
    );
  }
  if (task.payment) {
    const projName = task.payment.project?.projectName || "—";
    return (
      <Link to={`/payments?search=${task.payment.billNumber}`} className="text-xs text-blue-600 hover:underline">
        Payment: {task.payment.billNumber} / {projName}
      </Link>
    );
  }
  return <span className="text-xs text-muted-foreground">—</span>;
}

function MobileTaskCard({ task, onComplete, onCancel, onEdit, onDelete }: {
  task: Task;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const overdue = isOverdue(task);
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${overdue ? "border-red-200 bg-red-50/30" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
          )}
        </div>
        <TaskActions task={task} onComplete={onComplete} onCancel={onCancel} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
          {task.priority}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}>
          {task.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Assigned to <span className="font-medium text-foreground">{task.assignedTo.name}</span></span>
        {task.dueAt && (
          <span className={overdue ? "text-red-600 font-medium" : ""}>
            {overdue ? "Overdue · " : ""}{formatDue(task.dueAt)}
          </span>
        )}
      </div>
      <LinkedTo task={task} />
    </div>
  );
}

function TaskActions({ task, onComplete, onCancel, onEdit, onDelete }: {
  task: Task;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const done = task.status === "COMPLETED" || task.status === "CANCELLED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 rounded hover:bg-muted">
          <MoreVertical size={15} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(task)}>
          <Pencil size={14} className="mr-2" /> Edit
        </DropdownMenuItem>
        {!done && (
          <>
            <DropdownMenuItem onClick={() => onComplete(task.id)} className="text-green-600">
              <CheckCircle size={14} className="mr-2" /> Mark Complete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCancel(task.id)} className="text-red-500">
              <XCircle size={14} className="mr-2" /> Cancel Task
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
          <Trash2 size={14} className="mr-2" /> Delete Task
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TaskList() {
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState<{
    status?: string;
    priority?: string;
    assignedToId?: string;
  }>({});

  const { data, isLoading } = useTasks(page, {
    status: filters.status,
    priority: filters.priority,
    assignedToId: filters.assignedToId,
    search: search || undefined,
    sortBy,
    sortOrder,
  });
  const { data: usersData } = useUsers(1);
  const completeMutation = useCompleteTask();
  const cancelMutation = useCancelTask();
  const deleteMutation = useDeleteTask();

  const tasks = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  const pending = tasks.filter((t) => t.status === "PENDING").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const overdue = tasks.filter(isOverdue).length;

  const setFilter = (key: keyof typeof filters, value?: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div>
      <PageHeader title="Tasks" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: total, icon: <ListTodo size={20} className="text-blue-500" />, bg: "bg-blue-50" },
          { label: "Pending", value: pending, icon: <Circle size={20} className="text-yellow-500" />, bg: "bg-yellow-50" },
          { label: "In Progress", value: inProgress, icon: <Clock size={20} className="text-violet-500" />, bg: "bg-violet-50" },
          { label: "Overdue", value: overdue, icon: <XCircle size={20} className="text-red-500" />, bg: "bg-red-50" },
        ].map((card) => (
          <div key={card.label} className={`rounded-xl border p-3 flex items-center gap-3 ${card.bg}`}>
            <div className="shrink-0">{card.icon}</div>
            <div>
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search tasks by title..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-8 h-9 text-xs"
          />
        </div>

        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => setFilter("status", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.priority ?? "all"}
          onValueChange={(v) => setFilter("priority", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-28 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.assignedToId ?? "all"}
          onValueChange={(v) => setFilter("assignedToId", v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-32 text-xs"><SelectValue placeholder="Assigned To" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {usersData?.items.map((u) => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => { setPage(1); setSortBy(v); }}>
          <SelectTrigger className="w-32 text-xs"><SelectValue placeholder="Sort By" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Created Date</SelectItem>
            <SelectItem value="dueAt">Due Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={(v) => { setPage(1); setSortOrder(v as any); }}>
          <SelectTrigger className="w-28 text-xs"><SelectValue placeholder="Order" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">+ Create Task</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Task</DialogTitle></DialogHeader>
              <TaskForm onSuccess={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTask} onOpenChange={(o) => { if (!o) setEditTask(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
          {editTask && (
            <EditTaskForm task={editTask} onSuccess={() => setEditTask(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <ListTodo size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No tasks found</p>
          </div>
        ) : (
          tasks.map((task) => (
            <MobileTaskCard
              key={task.id}
              task={task}
              onComplete={(id) => completeMutation.mutate(id)}
              onCancel={(id) => cancelMutation.mutate(id)}
              onEdit={setEditTask}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Linked To</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <ListTodo size={36} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">No tasks found</p>
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <TableRow
                    key={task.id}
                    className={overdue ? "bg-red-50/40" : ""}
                  >
                    <TableCell className="py-3 max-w-xs">
                      <p className={`font-medium text-sm ${task.status === "COMPLETED" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
                        {task.priority}
                      </span>
                    </TableCell>

                    <TableCell className="py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}>
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </TableCell>

                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {task.assignedTo.name[0].toUpperCase()}
                        </div>
                        <span className="text-sm">{task.assignedTo.name}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3">
                      {task.dueAt ? (
                        <span className={`text-sm ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                          {overdue && "⚠ "}{formatDue(task.dueAt)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      <LinkedTo task={task} />
                    </TableCell>

                    <TableCell className="py-3">
                      <TaskActions
                        task={task}
                        onComplete={(id) => completeMutation.mutate(id)}
                        onCancel={(id) => cancelMutation.mutate(id)}
                        onEdit={setEditTask}
                        onDelete={(id) => deleteMutation.mutate(id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>Showing {tasks.length} of {total} tasks</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
