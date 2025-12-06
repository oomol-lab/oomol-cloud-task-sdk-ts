/**
 * Possible states of a task during its lifecycle.
 * - `pending`: Task is queued and waiting to be processed
 * - `running`: Task is currently being executed
 * - `success`: Task completed successfully
 * - `failed`: Task failed with an error
 */
export type TaskStatus = "pending" | "running" | "success" | "failed";

/**
 * Request payload for creating a new task.
 * @template IV - Type of the input values object
 */
export interface TaskCreateRequest<IV extends Record<string, unknown>> {
  /** The unique identifier of the applet to run */
  appletID: string;
  /** Input values to pass to the applet */
  inputValues: IV;
  /** Optional webhook URL to receive task completion notifications */
  webhookUrl?: string;
  /** Optional metadata to attach to the task */
  metadata?: Record<string, unknown>;
}

/**
 * Response returned after creating a task.
 */
export interface TaskCreateResponse {
  /** The unique identifier of the created task */
  taskID: string;
}

/**
 * Response containing the result of a task.
 * @template T - Type of the result data
 */
export interface TaskResultResponse<T = unknown> {
  /** Current status of the task */
  status: TaskStatus;
  /** Progress percentage (0-100), only available when task is running */
  progress?: number;
  /** Result data returned by the task on success */
  resultData?: T;
  /** Error message if the task failed */
  error?: string;
}

/**
 * Strategy for polling interval backoff.
 */
export enum BackoffStrategy {
  /** Use a fixed interval between polls */
  Fixed = "fixed",
  /** Increase interval exponentially between polls (recommended for long-running tasks) */
  Exponential = "exp",
}

/**
 * Options for awaiting task completion.
 */
export interface AwaitOptions {
  /** Base polling interval in milliseconds. @default 3000 */
  intervalMs?: number;
  /** Maximum time to wait for task completion in milliseconds. If exceeded, throws TimeoutError */
  timeoutMs?: number;
  /** Callback invoked on each poll with current progress and status */
  onProgress?: (progress: number | undefined, status: TaskStatus) => void;
  /** AbortSignal to cancel the polling operation */
  signal?: AbortSignal;
  /** Backoff configuration for polling intervals */
  backoff?: {
    /** Backoff strategy to use. @default BackoffStrategy.Exponential */
    strategy?: BackoffStrategy;
    /** Maximum interval between polls in milliseconds. @default 3000 */
    maxIntervalMs?: number;
  };
}

/**
 * Configuration options for the OomolTaskClient.
 */
export interface ClientOptions {
  /** API key for authentication */
  apiKey: string;
  /** Base URL of the API. @default "https://cloud-task.oomol.com/v1" */
  baseUrl?: string;
  /** Custom fetch implementation (useful for testing or environments without native fetch) */
  fetch?: typeof fetch;
  /** Additional headers to include in all requests */
  defaultHeaders?: Record<string, string>;
}
