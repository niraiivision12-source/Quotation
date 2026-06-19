import { useState } from "react";

import PageHeader from "@/components/ui/PageHeader";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import CreateProjectDialog from "./CreateProjectDialog";
import {
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from "./project.query";
import type { Project } from "./project.types";

const editProjectSchema = z.object({
  projectName: z.string().min(2),
  location: z.string().optional(),
  estimatedBudget: z.number().optional(),
});

type EditProjectForm = z.infer<typeof editProjectSchema>;

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
        <Button variant="outline" size="sm">
          Edit
        </Button>
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

function DeleteProjectButton({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteProject();

  const confirm = async () => {
    await deleteMutation.mutateAsync(project.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <strong>{project.projectName}</strong>
          ? This action cannot be undone.
        </p>
        <div className="flex gap-2 mt-4">
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectList() {
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const { data, isLoading } = useProjects(page, search);

  return (
    <div>
      <PageHeader title="Projects" />

      <div className="mb-4">
        <CreateProjectDialog />
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search project"
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
            <TableHead>Project</TableHead>

            <TableHead>Customer</TableHead>

            <TableHead>Location</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={4}>Loading...</TableCell>
            </TableRow>
          )}

          {!isLoading && data?.items.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>No projects found</TableCell>
            </TableRow>
          )}

          {data?.items.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <Link to={`/projects/${project.id}`}>
                  {project.projectName}
                </Link>
              </TableCell>

              <TableCell>{project.customer.name}</TableCell>

              <TableCell>{project.location || "-"}</TableCell>

              <TableCell>
                <div className="flex gap-2">
                  <EditProjectDialog project={project} />
                  <DeleteProjectButton project={project} />
                </div>
              </TableCell>
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
