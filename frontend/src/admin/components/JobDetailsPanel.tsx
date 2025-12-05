// src/admin/components/JobDetailsPanel.tsx
import React, { useEffect, useState } from 'react';
import type { Design, DesignEvent } from '../../types';
import { updateDesignNotes, fetchDesignEvents } from '../api/designs';

interface JobDetailsPanelProps {
  isOpen: boolean;
  design: Design | null;
  onClose: () => void;
  onNotesSaved: (id: number, notes: string) => void;
}

const JobDetailsPanel: React.FC<JobDetailsPanelProps> = ({
  isOpen,
  design,
  onClose,
  onNotesSaved,
}) => {
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [events, setEvents] = useState<DesignEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Sync notesDraft when design changes
  useEffect(() => {
    if (design) {
      setNotesDraft(design.notes ?? '');
    } else {
      setNotesDraft('');
    }
  }, [design]);

  // Load events when panel opens with a design
  useEffect(() => {
    if (!isOpen || !design) {
      setEvents([]);
      setEventsError(null);
      setInitialLoadDone(false);
      return;
    }

    let cancelled = false;

    async function loadEvents() {
      try {
        setEventsLoading(true);
        setEventsError(null);

        const res = await fetchDesignEvents(design.id);

        if (cancelled) return;
        setEvents(res);
        setInitialLoadDone(true);
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setEventsError(err.message ?? 'Failed to load activity');
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [isOpen, design?.id]);

  if (!isOpen || !design) return null;

  const handleSaveNotes = async () => {
    if (!design) return;

    try {
      setSavingNotes(true);
      await updateDesignNotes(design.id, notesDraft);
      onNotesSaved(design.id, notesDraft);
    } catch (err) {
      console.error(err);
      alert('Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const formatActionLabel = (ev: DesignEvent): string => {
    switch (ev.action) {
      case 'status_change':
        return 'Status changed';
      case 'note_update':
        return 'Notes updated';
      case 'archive':
        return 'Job archived';
      default:
        return ev.action;
    }
  };

  const formatActionDetail = (ev: DesignEvent): string | null => {
    if (ev.action === 'status_change' && ev.fromValue && ev.toValue) {
      return `${ev.fromValue} → ${ev.toValue}`;
    }

    if (ev.action === 'note_update') {
      if (!ev.toValue && !ev.fromValue) return null;
      if (!ev.fromValue && ev.toValue) return `Notes set to: "${ev.toValue}"`;
      if (ev.fromValue && ev.toValue && ev.fromValue !== ev.toValue) {
        return `Notes changed`;
      }
    }

    if (ev.action === 'archive') {
      return 'Job moved to archive';
    }

    return null;
  };

  const formatDateTime = (value: string): string => {
    if (!value) return '';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  const getEventDotClass = (ev: DesignEvent) => {
    switch (ev.action) {
      case 'status_change':
        return 'bg-brand-cta';
      case 'note_update':
        return 'bg-brand-blue';
      case 'archive':
        return 'bg-rose-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-end bg-slate-900/20 backdrop-blur-sm">
      {/* Clickable overlay to close */}
      <button
        type="button"
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
        aria-label="Close details"
      />

      {/* Side panel */}
      <aside className="relative z-50 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-slate-400">
              Job Details
            </p>
            <h2 className="text-sm font-semibold text-slate-900 break-all">
              {design.productId || `Job #${design.id}`}
            </h2>
            <p className="text-[11px] text-slate-500">
              Variant: {design.variantId || '—'} · Qty: {design.quantity}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Meta */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-900">
              Job metadata
            </h3>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-600 space-y-1">
              <p>
                <span className="font-semibold text-slate-800">ID:</span>{' '}
                {design.id}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Created:</span>{' '}
                {design.createdAt
                  ? formatDateTime(design.createdAt)
                  : '—'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Updated:</span>{' '}
                {design.updatedAt
                  ? formatDateTime(design.updatedAt)
                  : '—'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Status:</span>{' '}
                {design.status}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Color / Size:</span>{' '}
                {design.color || '—'} · {design.size || '—'}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Archived:</span>{' '}
                {design.archived ? 'Yes' : 'No'}
              </p>
            </div>
          </section>

          {/* Notes editor */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900">
                Internal notes
              </h3>
              {design.updatedAt && (
                <span className="text-[10px] text-slate-400">
                  Last updated {formatDateTime(design.updatedAt)}
                </span>
              )}
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              placeholder="Notes for production… (press Save to persist)"
            />
            <div className="flex justify-end gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setNotesDraft(design.notes ?? '')}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="rounded-full bg-slate-900 px-4 py-1 text-[11px] font-semibold text-white hover:bg-brand-cta disabled:opacity-50"
              >
                {savingNotes ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </section>

          {/* Activity Timeline */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-900">
                Activity
              </h3>
              {eventsLoading && (
                <span className="text-[10px] text-slate-400">
                  Loading…
                </span>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 max-h-64 overflow-y-auto">
              {eventsError && (
                <p className="text-[11px] text-rose-600">
                  {eventsError}
                </p>
              )}

              {!eventsError && !eventsLoading && events.length === 0 && initialLoadDone && (
                <p className="text-[11px] text-slate-500">
                  No activity recorded yet for this job.
                </p>
              )}

              {!eventsError && events.length > 0 && (
                <ol className="relative border-l border-slate-200 ml-2 space-y-3">
                  {events.map((ev) => {
                    const detail = formatActionDetail(ev);
                    return (
                      <li key={ev.id} className="ml-4">
                        <span
                          className={`absolute -left-[7px] mt-1 h-3 w-3 rounded-full border border-white shadow ${getEventDotClass(
                            ev
                          )}`}
                        />
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-semibold text-slate-800">
                              {formatActionLabel(ev)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatDateTime(ev.createdAt)}
                            </span>
                          </div>
                          {detail && (
                            <p className="text-[11px] text-slate-600">
                              {detail}
                            </p>
                          )}
                          {ev.action === 'note_update' && ev.toValue && (
                            <p className="mt-0.5 rounded-md bg-white/70 px-2 py-1 text-[11px] text-slate-700 border border-slate-200/70">
                              “{ev.toValue}”
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};

export default JobDetailsPanel;
