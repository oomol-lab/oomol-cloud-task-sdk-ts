import { ApiError, TaskFailedError, TimeoutError } from "./errors";
import {
  AwaitOptions,
  BackoffStrategy,
  ClientOptions,
  TaskCreateRequest,
  TaskCreateResponse,
  TaskResultResponse,
} from "./types";

const DEFAULT_BASE_URL = "https://cloud-task.oomol.com/v1";

export class OomolTaskClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;
  private readonly defaultHeaders: Record<string, string>;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetchFn = options.fetch ?? fetch;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  async createTask<IV extends Record<string, unknown>>(
    request: TaskCreateRequest<IV>
  ): Promise<TaskCreateResponse> {
    const body: Record<string, unknown> = {
      appletID: request.appletID,
      inputValues: request.inputValues,
    };
    if (request.webhookUrl) body.webhookUrl = request.webhookUrl;
    if (request.metadata) body.metadata = request.metadata;

    const res = await this.request("/task/applet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res as TaskCreateResponse;
  }

  async getTaskResult<T = unknown>(taskID: string): Promise<TaskResultResponse<T>> {
    const res = await this.request(`/task/${taskID}/result`, { method: "GET" });
    return res as TaskResultResponse<T>;
  }

  async awaitResult<T = unknown>(taskID: string, options: AwaitOptions = {}): Promise<TaskResultResponse<T>> {
    const intervalBase = options.intervalMs ?? 2000;
    const maxInterval = options.backoff?.maxIntervalMs ?? 15000;
    const strategy = options.backoff?.strategy ?? BackoffStrategy.Fixed;
    const controller = new AbortController();
    const externalSignal = options.signal;
    let aborted = false;
    if (externalSignal) {
      if (externalSignal.aborted) aborted = true;
      externalSignal.addEventListener("abort", () => {
        aborted = true;
        controller.abort();
      });
    }

    const timeoutMs = options.timeoutMs;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof timeoutMs === "number" && timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        aborted = true;
        controller.abort();
      }, timeoutMs);
    }

    try {
      let attempt = 0;
      while (true) {
        if (aborted) throw new TimeoutError();
        const result = await this.getTaskResult<T>(taskID);
        if (result.status === "success") {
          return result;
        }
        if (result.status === "failed") {
          throw new TaskFailedError(taskID, result.error ?? result);
        }
        options.onProgress?.(result.progress, result.status);
        attempt += 1;
        const nextInterval =
          strategy === BackoffStrategy.Exponential
            ? Math.min(maxInterval, intervalBase * Math.pow(1.5, attempt))
            : intervalBase;
        await new Promise((r) => setTimeout(r, nextInterval));
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  async createAndWait<IV extends Record<string, unknown>, T = unknown>(
    request: TaskCreateRequest<IV>,
    awaitOptions: AwaitOptions = {}
  ): Promise<{ taskID: string; result: TaskResultResponse<T> }> {
    const { taskID } = await this.createTask(request);
    const result = await this.awaitResult<T>(taskID, awaitOptions);
    return { taskID, result };
  }

  private async request(path: string, init: RequestInit): Promise<unknown> {
    const url = this.buildUrl(path);
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      ...this.defaultHeaders,
      ...(init.headers ?? {}),
    } as Record<string, string>;
    const res = await this.fetchFn(url, { ...init, headers });
    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        body = undefined;
      }
      throw new ApiError(`Request failed: ${res.status}`, res.status, body);
    }
    const data = await res.json();
    return data;
  }

  private buildUrl(path: string): string {
    const base = this.baseUrl.endsWith("/") ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  }
}

export * from "./types";
export * from "./errors";
