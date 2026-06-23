import { zodResolver } from "@hookform/resolvers/zod";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/ui/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import CreateProjectDialog from "./CreateProjectDialog";
import {
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "./project.query";
import type { Project } from "./project.types";

const PHASE_COLORS: Record<string, string> = {
  PIPES: "bg-orange-100 text-orange-700",
  WIRING: "bg-yellow-100 text-yellow-700",
  SWITCHES: "bg-blue-100 text-blue-700",
  LIGHTS: "bg-violet-100 text-violet-700",
  FANS: "bg-teal-100 text-teal-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const editProjectSchema = z.object({
  projectName: z.string().min(2),
  location: z.string().optional(),
  estimatedBudget: z.number().optional(),
});

type EditProjectForm = z.infer<typeof editProjectSchema>;

function ProjectAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
      {initials}
    </div>
  );
}

function EditProjectDialog({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const mutation = useUpdateProject();

  const form = useForm<EditProjectForm>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      projectName: project.projectName,
      location: project.location ?? "",
      estimatedBudget: project.estimatedBudget
        ? Number(project.estimatedBudget)
        : undefined,
    },
  });

  const submit = async (data: EditProjectForm) => {
    await mutation.mutateAsync({ id: project.id, data });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project — {project.projectName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <Input
            placeholder="Project Name *"
            {...form.register("projectName")}
          />
          <Input placeholder="Location" {...form.register("location")} />
          <Input
            placeholder="Estimated Budget"
            type="number"
            {...form.register("estimatedBudget", { valueAsNumber: true })}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectActions({ project }: { project: Project }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMutation = useDeleteProject();

  const confirm = async () => {
    await deleteMutation.mutateAsync(project.id);
    setDeleteOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <EditProjectDialog project={project} />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>{project.projectName}</strong>? This action cannot be
            undone.
          </p>
          <div className="flex gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={confirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function ProjectList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useProjects(page, search);

  return (
    <div>
      <PageHeader title="Projects" />

      <div className="flex items-center justify-between mb-4 gap-3">
        <Input
          placeholder="Search projects..."
          value={search}
          className="max-w-sm"
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <CreateProjectDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Current Phase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10 text-muted-foreground"
                >
                  No projects found.
                </TableCell>
              </TableRow>
            )}

            {data?.items.map((project) => (
              <TableRow key={project.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ProjectAvatar name={project.projectName} />
                    <div>
                      <Link
                        to={`/projects/${project.id}`}
                        className="font-medium text-sm hover:underline text-violet-700"
                      >
                        {project.projectName}
                      </Link>
                      {project.location && (
                        <p className="text-xs text-muted-foreground">
                          {project.location}
                        </p>
                      )}
                      {project.customer.mobile && (
                        <p className="text-xs text-muted-foreground">
                          {project.customer.mobile}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <CustomerAvatar name={project.customer.name} />
                    <div>
                      <p className="font-medium text-sm">
                        {project.customer.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.customer.mobile}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${PHASE_COLORS[project.currentPhase] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {project.currentPhase.charAt(0) +
                      project.currentPhase.slice(1).toLowerCase()}
                  </span>
                </TableCell>

                <TableCell>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-semibold ${project.isCompleted ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {project.isCompleted ? "Completed" : "Active"}
                  </span>
                </TableCell>

                <TableCell className="text-sm">
                  {project.estimatedBudget
                    ? `₹${Number(project.estimatedBudget).toLocaleString()}`
                    : "—"}
                </TableCell>

                <TableCell>
                  <ProjectActions project={project} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          {data ? `Showing ${data.items.length} of ${data.total} projects` : ""}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data || page * 20 >= data.total}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
