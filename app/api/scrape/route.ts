import { db } from '@/db';
import { cars } from '@/db/schema';
import { runScrapeAndIngest } from '@/lib/ingestListings';

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        await db.delete(cars);
        await runScrapeAndIngest(
          {},
          (done, total) => send({ done, total })
        );
        send({ finished: true });
      } catch (err) {
        send({ error: err instanceof Error ? err.message : 'Nieznany błąd skanowania.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
