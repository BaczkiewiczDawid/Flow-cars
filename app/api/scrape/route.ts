import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { cars } from '@/db/schema';
import { auth } from '@/auth';
import { runScrapeAndIngest } from '@/lib/ingestListings';
import { NextResponse } from 'next/server';

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        await db.delete(cars).where(eq(cars.userId, userId));
        await runScrapeAndIngest(
          {},
          userId,
          (done, total) => send({ done, total })
        );
        send({ finished: true });
      } catch (err) {
        const cause = err instanceof Error ? (err.cause instanceof Error ? err.cause.message : null) : null;
        const msg = err instanceof Error ? err.message : 'Nieznany błąd skanowania.';
        send({ error: cause ? `${cause}` : msg });
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
