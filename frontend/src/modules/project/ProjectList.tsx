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

import { useProjects } from "./project.query";

export default function ProjectList() {
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");

  const { data, isLoading } = useProjects(page, search);

  return (
    <div>
      <PageHeader title="Projects" />

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
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && (
            <TableRow>
              <TableCell colSpan={3}>Loading...</TableCell>
            </TableRow>
          )}

          {data?.items.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.projectName}</TableCell>

              <TableCell>{project.customer.name}</TableCell>

              <TableCell>{project.location}</TableCell>
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
