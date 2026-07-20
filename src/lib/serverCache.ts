import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { ApiEnvelope } from "./types";

// Shared server-side cache for quota-limited upstream APIs (flights, trains,
// news). The upstream is called at most once per TTL no matter how often the
// client polls — this is what keeps the free API tiers from being exhausted.
// Disk cache survives restarts; an in-memory copy covers read-only serverless
// filesystems (both are best-effort).

interface Entry {
  ts: number;
  envelope: ApiEnvelope<unknown>;
}

const mem = new Map<string, Entry>();

function file(name: string): string {
  return join(process.cwd(), ".cache", `${name}.json`);
}

// Freshest cached entry (memory or disk), or null if none.
function load(name: string): Entry | null {
  let entry = mem.get(name) ?? null;
  try {
    const disk = JSON.parse(readFileSync(file(name), "utf8")) as Entry;
    if (!entry || disk.ts > entry.ts) {
      entry = disk;
      mem.set(name, disk);
    }
  } catch {
    /* no disk cache */
  }
  return entry;
}

// Cached envelope if still within ttlMs, else null (caller should refetch).
export function readFresh<T>(name: string, ttlMs: number): ApiEnvelope<T> | null {
  const entry = load(name);
  if (entry && Date.now() - entry.ts < ttlMs) return entry.envelope as ApiEnvelope<T>;
  return null;
}

// Any cached envelope regardless of age — a last resort when a refetch fails.
export function readStale<T>(name: string): ApiEnvelope<T> | null {
  const entry = load(name);
  return entry ? (entry.envelope as ApiEnvelope<T>) : null;
}

export function write<T>(name: string, envelope: ApiEnvelope<T>): void {
  const entry: Entry = { ts: Date.now(), envelope };
  mem.set(name, entry);
  try {
    mkdirSync(join(process.cwd(), ".cache"), { recursive: true });
    writeFileSync(file(name), JSON.stringify(entry));
  } catch {
    /* best-effort */
  }
}
