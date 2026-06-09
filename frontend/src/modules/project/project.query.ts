import { useQuery } from "@tanstack/react-query";

import { getProjects } from "./project.api";

export const useProjects = (page: number, search: string) => {
  return useQuery({
    queryKey: ["projects", page, search],

    queryFn: () => getProjects(page, 20, search),
  });
};
