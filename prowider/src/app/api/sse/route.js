import { addSSEClient, removeSSEClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`)
      );

      const client = {
        write(message) {
          try {
            controller.enqueue(encoder.encode(message));
          } catch {
            // Stream already closed
          }
        },
      };

      addSSEClient(client);

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(keepAlive);
          removeSSEClient(client);
        }
      }, 20_000);

      return () => {
        clearInterval(keepAlive);
        removeSSEClient(client);
      };
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}