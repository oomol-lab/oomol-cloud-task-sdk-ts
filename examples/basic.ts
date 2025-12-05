import { OomolTaskClient, BackoffStrategy } from "../src/index";

async function main() {
  const client = new OomolTaskClient({ apiKey: "YOUR_API_KEY" });

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
      intervalMs: 2000,
      backoff: { strategy: BackoffStrategy.Exponential, maxIntervalMs: 10000 },
      onProgress: (progress, status) => {
        console.log(`任务进行中: status=${status} progress=${progress ?? 0}%`);
      },
    }
  );

  console.log("任务完成", taskID, result);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});