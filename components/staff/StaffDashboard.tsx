"use client";

import { Copy, Plus, Radio } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PatientCard } from "./PatientCard";
import { Button } from "../ui/Button";
import { joinStaffDashboard, onPatientList, onPatientSnapshot } from "../../lib/socket-client";
import type { PatientSnapshot } from "../../lib/schema";

export function StaffDashboard() {
  const [snapshots, setSnapshots] = useState<Record<string, PatientSnapshot>>({});
  const [newSessionUrl, setNewSessionUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    joinStaffDashboard();

    const offList = onPatientList((patientList) => {
      setSnapshots(Object.fromEntries(patientList.map((snapshot) => [snapshot.sessionId, snapshot])));
    });

    const offSnapshot = onPatientSnapshot((snapshot) => {
      setSnapshots((current) => ({
        ...current,
        [snapshot.sessionId]: snapshot
      }));
    });

    return () => {
      offList();
      offSnapshot();
    };
  }, []);

  const patientList = useMemo(
    () =>
      Object.values(snapshots).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [snapshots]
  );

  async function createSession() {
    setIsCreating(true);

    try {
      const response = await fetch("/api/session", { method: "POST" });
      const payload = (await response.json()) as { sessionId: string };
      const url = `${window.location.origin}/form/${payload.sessionId}`;
      setNewSessionUrl(url);
    } finally {
      setIsCreating(false);
    }
  }

  async function copyLink() {
    if (newSessionUrl) {
      await navigator.clipboard.writeText(newSessionUrl);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
              <Radio className="h-4 w-4" aria-hidden="true" />
              Live staff dashboard
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">Patient intake queue</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600">
              Monitor active sessions, live field updates, and submitted intake records.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled={isCreating} onClick={createSession} type="button">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {isCreating ? "Creating..." : "New session"}
            </Button>
            <Button disabled={!newSessionUrl} onClick={copyLink} type="button" variant="secondary">
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy link
            </Button>
          </div>
        </header>

        {newSessionUrl ? (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            {newSessionUrl}
          </div>
        ) : null}

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          {patientList.length > 0 ? (
            patientList.map((snapshot) => <PatientCard key={snapshot.sessionId} snapshot={snapshot} />)
          ) : (
            <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 xl:col-span-2">
              No active patient sessions yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
