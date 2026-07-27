import { ExternalLink } from "lucide-react";
import { LiveFieldViewer } from "./LiveFieldViewer";
import { StatusBadge } from "./StatusBadge";
import type { PatientSnapshot } from "../../lib/schema";

export function PatientCard({ snapshot }: { snapshot: PatientSnapshot }) {
  const formUrl = `/form/${snapshot.sessionId}`;

  return (
    <article className="rounded-md border border-zinc-200 bg-white p-4 shadow-panel">
      <div className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-zinc-950">{snapshot.sessionId}</h2>
          <p className="mt-1 text-xs text-zinc-500">Updated {new Date(snapshot.updatedAt).toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={snapshot.status} />
          <a
            aria-label={`Open patient form for ${snapshot.sessionId}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            href={formUrl}
            target="_blank"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="mt-4">
        <LiveFieldViewer data={snapshot.data} status={snapshot.status} />
      </div>
    </article>
  );
}
