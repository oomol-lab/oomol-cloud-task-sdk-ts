export type TaskStatus = "pending" | "running" | "success" | "failed";

export interface TaskCreateRequest<IV extends Record<string, unknown>> {
  appletID: string;
  inputValues: IV;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskCreateResponse {
  taskID: string;
}

export interface TaskResultResponse<T = unknown> {
  status: TaskStatus;
  progress?: number;
  resultData?: T;
  error?: string;
}

export enum BackoffStrategy {
  Fixed = "fixed",
  Exponential = "exp",
}

export interface AwaitOptions {
  intervalMs?: number;
  timeoutMs?: number;
  onProgress?: (progress: number | undefined, status: TaskStatus) => void;
  signal?: AbortSignal;
  backoff?: {
    strategy?: BackoffStrategy;
    maxIntervalMs?: number;
  };
}

export interface ClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof fetch;
  defaultHeaders?: Record<string, string>;
}
