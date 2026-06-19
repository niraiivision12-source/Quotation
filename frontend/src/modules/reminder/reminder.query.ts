import { queryClient } from "@/lib/query-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  getMyReminders,
  getOverdueReminders,
} from "./reminder.api";
import type { CreateReminderInput } from "./reminder.types";

export const REMINDER_KEY = ["reminders"];

export const useMyReminders = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: [...REMINDER_KEY, page, limit],
    queryFn: () => getMyReminders(page, limit),
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
    },
  });
};

export const useCompleteReminder = () => {
  return useMutation({
    mutationFn: (id: string) => completeReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_KEY });
      queryClient.invalidateQueries({ queryKey: ["reminders-overdue"] });
    },
  });
};

export const useDeleteReminder = () => {
  return useMutation({
    mutationFn: (id: string) => deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_KEY });
      queryClient.invalidateQueries({ queryKey: ["reminders-overdue"] });
    },
  });
};
