import { ListTodo, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "../../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";

import TaskForm from "../../task/TaskForm";
import { useCancelTask, useCompleteTask, useTasks } from "../../task/task.query";
import type { Task } from "../../task/task.types";

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

export default function LeadTasks({ leadId }: { leadId: string }) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useTasks(1, { leadId }, 100);
  const completeMutation = useCompleteTask();
  const cancelMutation = useCancelTask();

  const tasks = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">+ Add Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
            <TaskForm leadId={leadId} onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-10">
          <ListTodo size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No tasks yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const overdue = isOverdue(task);
            const done = task.status === "COMPLETED" || task.status === "CANCELLED";
            return (
              <div
                key={task.id}
                className={`rounded-lg border p-3 flex items-start gap-3 ${overdue ? "border-red-200 bg-red-50/30" : "bg-white"}`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority]}`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}>
                      {task.status.replace(/_/g, " ")}
                    </span>
                    {task.dueAt && (
                      <span className={`text-xs ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        {overdue ? "⚠ Overdue · " : "Due: "}
                        {new Date(task.dueAt).toLocaleDateString([], { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Assigned to <span className="font-medium text-foreground">{task.assignedTo.name}</span>
                  </p>
                </div>

                {!done && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded hover:bg-muted shrink-0">
                        <MoreVertical size={14} className="text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => completeMutation.mutate(task.id)} className="text-green-600">
                        <CheckCircle size={13} className="mr-2" /> Mark Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => cancelMutation.mutate(task.id)} className="text-red-500">
                        <XCircle size={13} className="mr-2" /> Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
