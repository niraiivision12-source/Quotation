import { queryClient } from "@/lib/query-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  getMyReminders,
  getOverdueReminders,
  updateReminder,
} from "./reminder.api";
import type { CreateReminderInput } from "./reminder.types";

export const REMINDER_KEY = ["reminders"];

export const useMyReminders = (page = 1, limit = 50, projectId?: string) => {
  return useQuery({
    queryKey: [...REMINDER_KEY, page, limit, projectId],
    queryFn: () => getMyReminders(page, limit, projectId),
  });
};

export const useOverdueReminders = () => {
  return useQuery({
    queryKey: ["reminders-overdue"],
    queryFn: getOverdueReminders,
    refetchInterval: 5 * 60 * 1000,
  });
};

export const useCreateReminder = () => {
  return useMutation({
    mutationFn: (data: CreateReminderInput) => createReminder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_KEY });
      queryClient.invalidateQueries({ queryKey: ["reminders-overdue"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

export const useCompleteReminder = () => {
  return useMutation({
    mutationFn: (id: string) => completeReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_KEY });
      queryClient.invalidateQueries({ queryKey: ["reminders-overdue"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

export const useDeleteReminder = () => {
  return useMutation({
    mutationFn: (id: string) => deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_KEY });
      queryClient.invalidateQueries({ queryKey: ["reminders-overdue"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};

export const useUpdateReminder = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateReminder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_KEY });
      queryClient.invalidateQueries({ queryKey: ["reminders-overdue"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
    },
  });
};
