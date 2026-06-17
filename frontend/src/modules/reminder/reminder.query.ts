import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  getMyReminders,
  getOverdueReminders,
} from "./reminder.api";
import type { CreateReminderInput } from "./reminder.types";

export const REMINDER_KEY = ["reminders"];

export const useMyReminders = () => {
  return useQuery({
    queryKey: REMINDER_KEY,
    queryFn: () => getMyReminders(),
  });
};

export const useOverdueReminders = () => {
  return useQuery({
    queryKey: ["reminders-overdue"],
    queryFn: getOverdueReminders,
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
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
