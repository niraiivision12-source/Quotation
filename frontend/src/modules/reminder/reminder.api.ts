import { api } from "@/lib/axios";
import type { CreateReminderInput, Reminder, ReminderListResponse } from "./reminder.types";

export const getMyReminders = async (page = 1, limit = 50, leadId?: string): Promise<ReminderListResponse> => {
  const res = await api.get("/reminders/my", { params: { page, limit, ...(leadId ? { leadId } : {}) } });
  return res.data.data;
};

export const getOverdueReminders = async (): Promise<Reminder[]> => {
  const res = await api.get("/reminders/overdue");
  return res.data.data;
};

export const createReminder = async (data: CreateReminderInput): Promise<Reminder> => {
  const res = await api.post("/reminders", data);
  return res.data.data;
};

export const completeReminder = async (id: string): Promise<Reminder> => {
  const res = await api.patch(`/reminders/${id}/complete`);
  return res.data.data;
};

export const deleteReminder = async (id: string): Promise<void> => {
  await api.delete(`/reminders/${id}`);
};
