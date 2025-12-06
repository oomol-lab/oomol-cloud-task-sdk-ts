# Oomol Cloud Task SDK (TypeScript)

A lightweight, developer-friendly SDK for `https://cloud-task.oomol.com/v1` to create tasks and wait for results without writing polling code.

## Features

- Simple client with `createTask`, `awaitResult`, and `createAndWait`
- Generic `inputValues` to support many applet scenarios
- Built-in retry and exponential backoff
- Progress callbacks, timeout and cancellation via `AbortSignal`
- No external dependencies

## Install

```bash
npm install oomol-cloud-task-sdk
```

## Usage

```ts
import { OomolTaskClient } from "oomol-cloud-task-sdk";

const client = new OomolTaskClient({
  apiKey: "YOUR_API_KEY",
});

const { taskID, result } = await client.createAndWait(
  {
    appletID: "54dfbca0-6b2a-4738-bc38-c602981d9be6",
    inputValues: {
      input_pdf: "<必填>",
      output_path: "<必填>",
      compression_level: null,
      optimize_images: false,
      remove_metadata: null,
    },
  },
  {
    onProgress: (p, s) => console.log(`status=${s} progress=${p ?? 0}`),
  }
);

console.log(taskID, result);
```

## API

- `new OomolTaskClient(options)`
  - `apiKey`: string
  - `baseUrl?`: string
  - `fetch?`: custom fetch
  - `defaultHeaders?`: record

- `createTask(request)` → `{ taskID }`
  - `appletID`: string
  - `inputValues`: record
  - `webhookUrl?`: string
  - `metadata?`: record

- `awaitResult(taskID, options)` → `TaskResultResponse`
  - `intervalMs?`: number (default: 3000)
  - `timeoutMs?`: number
  - `onProgress?`: callback
  - `signal?`: AbortSignal
  - `backoff?`: `{ strategy?: BackoffStrategy; maxIntervalMs?: number }` (default: `{ strategy: Exponential, maxIntervalMs: 3000 }`)

- `createAndWait(request, options)` → `{ taskID, result }`

## Notes

- If the server offers webhooks or SSE, you can add `webhookUrl` during `createTask` or integrate an events endpoint; this client focuses on a zero-dependency, promise-based workflow.
