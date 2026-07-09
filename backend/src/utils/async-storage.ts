import { AsyncLocalStorage } from "async_hooks";

export interface DevRequestStore {
  requestId: string;
  sqlQueries: {
    query: string;
    params: string;
    duration: number;
    timestamp: Date;
  }[];
  error?: {
    message: string;
    name: string;
    stack?: string;
    raw?: any;
  };
}

export const devLocalStorage = new AsyncLocalStorage<DevRequestStore>();
