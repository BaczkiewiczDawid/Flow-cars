import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Domyślnie baza trzymana jest w lokalnym pliku SQLite (file:./local.db).
// Do produkcji / Vercel można podać URL do bazy Turso (libSQL) w zmiennej DATABASE_URL,
// np. "libsql://twoja-baza.turso.io" + DATABASE_AUTH_TOKEN.
const url = process.env.DATABASE_URL ?? 'file:./local.db';
const authToken = process.env.DATABASE_AUTH_TOKEN;

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
