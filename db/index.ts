import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// WHATWG URL only parses userinfo for special schemes (http/https).
// Replace postgresql:// → https:// so username with dots (Supabase format) is parsed correctly.
const raw = process.env.DATABASE_URL!.replace(/^postgresql:\/\//, 'https://');
const url = new URL(raw);

const pool = new Pool({
  host: url.hostname,
  port: Number(url.port) || 5432,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  ssl: { rejectUnauthorized: false },
  max: 1,
});

export const db = drizzle(pool, { schema });
