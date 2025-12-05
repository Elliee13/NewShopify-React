import React, { useEffect, useState } from 'react';
import type { Design, DesignStatus, DesignsSummary } from '../../types';
import { fetchDesigns, updateDesignStatus, archiveDesign } from '../api/designs';
import StatusDropdown from '../components/StatusDropdown';
import ArtworkModal from '../components/ArtworkModal';
import JobDetailsPanel from '../components/JobDetailsPanel';
import { Search } from 'lucide-react';

interface DesignsPageProps {
  initialStatus?: DesignStatus | 'all';
}

const DesignsPage: React.FC<DesignsPageProps> = ({
  initialStatus = 'pending',
}) => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [statusFilter, setStatusFilter] = useState<DesignStatus | 'all'>(initialStatus);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);

  const [sort, setSort] = useState<'created_desc' | 'created_asc'>('created_desc');

  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [summary, setSummary] = useState<DesignsSummary | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);

  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [isArtworkOpen, setIsArtworkOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // 👇 NEW: include archived toggle
  const [includeArchived, setIncludeArchived] = useState(false);

  const openDetails = (design: Design) => {
    setSelectedDesign(design);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelectedDesign(null);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadDesigns() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchDesigns({
          status: statusFilter,
          search: search || undefined,
          sort,
          page,
          perPage,
          includeArchived, // 👈 NEW
        });

        if (cancelled) return;

        setDesigns(res.data);
        setTotal(res.pageInfo.total);
        setHasNextPage(res.pageInfo.hasNextPage);
        setHasPreviousPage(res.pageInfo.hasPreviousPage);
        setSummary(res.summary ?? null);
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          setError(err.message ?? 'Failed to load designs');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDesigns();
    return () => {
      cancelled = true;
    };
  }, [statusFilter, search, page, perPage, sort, includeArchived]); // 👈 includeArchived added here

  const handleStatusClick = (status: DesignStatus | 'all') => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleStatusChange = async (id: number, nextStatus: DesignStatus) => {
    const current = designs.find((d) => d.id === id);
    if (!current || current.status === nextStatus) return;

    const previousStatus = current.status;

    setUpdatingId(id);
    setDesigns((items) =>
      items.map((d) => (d.id === id ? { ...d, status: nextStatus } : d))
    );

    try {
      await updateDesignStatus(id, nextStatus);
    } catch (err) {
      console.error(err);
      alert('Failed to update status. Reverting…');
      setDesigns((items) =>
        items.map((d) => (d.id === id ? { ...d, status: previousStatus } : d))
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      if (!navigator.clipboard) {
        alert('Copy not supported in this browser.');
        return;
      }
      await navigator.clipboard.writeText(value);
      console.log(`Copied ${label} to clipboard`);
    } catch (err) {
      console.error(err);
      alert('Failed to copy to clipboard.');
    }
  };

  const handleArchive = async (id: number) => {
    const design = designs.find((d) => d.id === id);
    if (!design) return;

    if (!window.confirm('Archive this job? It will be hidden from the list.')) {
      return;
    }

    setArchivingId(id);

    try {
      await archiveDesign(id);
      setDesigns((items) => items.filter((d) => d.id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error(err);
      alert('Failed to archive job.');
    } finally {
      setArchivingId(null);
    }
  };

  const openArtwork = (design: Design) => {
    setSelectedDesign(design);
    setIsArtworkOpen(true);
  };

  const closeArtwork = () => {
    setIsArtworkOpen(false);
    setSelectedDesign(null);
  };

  const getStatusAccent = (status: DesignStatus) => {
    switch (status) {
      case 'pending':
        return 'border-l-4 border-brand-cta';
      case 'printing':
        return 'border-l-4 border-brand-blue';
      case 'completed':
        return 'border-l-4 border-emerald-500';
      default:
        return 'border-l-4 border-slate-200';
    }
  };

  const getStatusLabel = (status: DesignStatus | 'all') => {
    if (status === 'all') return 'All jobs';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // 👇 NEW: Export CSV for current view
  const handleExportCsv = () => {
    if (!designs.length) {
      alert('No jobs to export for this view.');
      return;
    }

    const headers = [
      'id',
      'productId',
      'variantId',
      'color',
      'size',
      'quantity',
      'status',
      'archived',
      'createdAt',
      'updatedAt',
      'artworkUrl',
      'checkoutUrl',
      'notes',
    ];

    const rows = designs.map((d) => [
      d.id,
      d.productId ?? '',
      d.variantId ?? '',
      d.color ?? '',
      d.size ?? '',
      d.quantity ?? '',
      d.status ?? '',
      (d as any).archived ?? 0,
      d.createdAt ?? '',
      d.updatedAt ?? '',
      d.artworkUrl ?? '',
      d.checkoutUrl ?? '',
      d.notes ?? '',
    ]);

    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((value) => {
            const str = String(value ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(',')
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `print-jobs-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* HEADER */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm px-8 py-7">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: title + copy */}
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-400">
              PRODUCTION QUEUE
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-display font-bold tracking-tight text-slate-900">
              Live Print Jobs
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Internal tools for production staff. In-house orders flowing in
              from the custom builder — built for the crew on the floor, not a
              faceless dashboard.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Environment: Dev
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                Phase 2 · Internal only
              </span>
            </div>
          </div>

          {/* Right: metrics grid */}
          {summary && (
            <div className="grid grid-cols-2 gap-3 min-w-[260px]">
              <div className="col-span-2 rounded-2xl bg-slate-900 text-white px-4 py-3 flex flex-col justify-between">
                <span className="text-[11px] uppercase tracking-[0.18em] text-slate-300">
                  Total Jobs
                </span>
                <span className="mt-1 text-3xl font-display font-bold">
                  {summary.total}
                </span>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Pending
                </p>
                <p className="mt-1 text-xl font-display font-bold text-slate-900">
                  {summary.pending}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Printing
                </p>
                <p className="mt-1 text-xl font-display font-bold text-slate-900">
                  {summary.printing}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                  Completed
                </p>
                <p className="mt-1 text-xl font-display font-bold text-slate-900">
                  {summary.completed}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-4 text-[11px] font-bold tracking-[0.16em] uppercase">
          {(['all', 'pending', 'printing', 'completed'] as const).map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusClick(status)}
                className={`relative pb-1.5 transition-colors ${
                  isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {status === 'all'
                  ? 'All Jobs'
                  : status.charAt(0).toUpperCase() + status.slice(1)}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-[3px] rounded-full bg-brand-cta" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sort, Include Archived, Search, Export */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="uppercase tracking-[0.18em] text-[10px]">
              Sort
            </span>
            <select
              value={sort}
              onChange={(e) => {
                const value = e.target.value as 'created_desc' | 'created_asc';
                setSort(value);
                setPage(1);
              }}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            >
              <option value="created_desc">Newest First</option>
              <option value="created_asc">Oldest First</option>
            </select>
          </div>

          {/* Include archived toggle */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <label className="inline-flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-slate-300 text-slate-900 focus:ring-slate-900/5"
                checked={includeArchived}
                onChange={(e) => {
                  setIncludeArchived(e.target.checked);
                  setPage(1);
                }}
              />
              <span>Include archived</span>
            </label>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search product, color, size…"
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-800 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* MINI META ROW */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          {loading && <span>Loading jobs…</span>}
          {!loading && !error && (
            <>
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-900">
                  {designs.length}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-900">
                  {total}
                </span>{' '}
                jobs
              </span>
              <span className="hidden sm:inline text-slate-400">
                · Filter: {getStatusLabel(statusFilter)}
              </span>
            </>
          )}
          {error && <span className="text-rose-600">{error}</span>}
        </div>
        <div className="uppercase tracking-[0.18em] text-[10px] text-slate-400">
          Page {page}
        </div>
      </div>

      {/* TABLE */}
      <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
        {loading && (
          <div className="p-4 text-sm text-slate-600">Loading jobs…</div>
        )}

        {!loading && error && (
          <div className="p-4 text-sm text-rose-700">{error}</div>
        )}

        {!loading && !error && designs.length === 0 && (
          <div className="p-6 text-sm text-slate-600">
            No jobs found for this filter.
          </div>
        )}

        {!loading && !error && designs.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/90 border-b border-slate-200">
                <tr className="text-[11px] font-bold tracking-[0.16em] uppercase text-slate-500">
                  <th className="text-left px-5 py-3 w-44">Created</th>
                  <th className="text-left px-5 py-3">Job</th>
                  <th className="text-left px-5 py-3 w-16">Qty</th>
                  <th className="text-left px-5 py-3 w-32">Status</th>
                  <th className="text-left px-5 py-3 w-32">Artwork</th>
                  <th className="text-right px-5 py-3 w-52">
                    Checkout & Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {designs.map((d) => (
                  <tr
                    key={d.id}
                    className={`transition-colors hover:bg-slate-50/80 ${getStatusAccent(
                      d.status
                    )}`}
                  >
                    {/* Created */}
                    <td className="px-5 py-3 align-top text-xs text-slate-600">
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleString()
                        : '—'}
                    </td>

                    {/* Job */}
                    <td className="px-5 py-3 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-semibold text-slate-900 break-all">
                          {d.productId || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {d.color || '—'} · {d.size || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Variant: {d.variantId || '—'}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                          {d.productId && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(d.productId!, 'product ID')
                              }
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            >
                              Copy product
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openDetails(d)}
                            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                          >
                            Details
                          </button>
                          {d.variantId && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(d.variantId!, 'variant ID')
                              }
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            >
                              Copy variant
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="px-5 py-3 align-top text-sm font-semibold text-slate-900">
                      {d.quantity}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3 align-top">
                      <div className="inline-flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            d.status === 'pending'
                              ? 'bg-brand-cta'
                              : d.status === 'printing'
                              ? 'bg-brand-blue'
                              : d.status === 'completed'
                              ? 'bg-emerald-500'
                              : 'bg-slate-300'
                          }`}
                        />
                        <StatusDropdown
                          value={d.status}
                          disabled={
                            updatingId === d.id || archivingId === d.id
                          }
                          onChange={(next) => handleStatusChange(d.id, next)}
                        />
                      </div>
                    </td>

                    {/* Artwork */}
                    <td className="px-5 py-3 align-top">
                      {d.artworkUrl ? (
                        <button
                          type="button"
                          onClick={() => openArtwork(d)}
                          className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-brand-cta transition-colors"
                        >
                          View artwork
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          No file
                        </span>
                      )}
                    </td>

                    {/* Checkout + Archive */}
                    <td className="px-5 py-3 align-top text-right">
                      <div className="flex flex-col items-end gap-1">
                        {d.checkoutUrl ? (
                          <>
                            <a
                              href={d.checkoutUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-900 hover:border-brand-blue/40 hover:bg-slate-50"
                            >
                              Open checkout
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(d.checkoutUrl!, 'checkout URL')
                              }
                              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            >
                              Copy checkout URL
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            —
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={archivingId === d.id}
                          onClick={() => handleArchive(d.id)}
                          className="mt-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {archivingId === d.id ? 'Archiving…' : 'Archive'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {!loading && !error && (
        <div className="mt-2 flex items-center justify-between rounded-full border border-slate-200 bg-white px-4 py-2 text-[11px] text-slate-600 shadow-sm">
          <div>
            Page{' '}
            <span className="font-semibold text-slate-900">{page}</span> of{' '}
            <span className="font-semibold text-slate-900">
              {Math.max(1, Math.ceil(total / perPage))}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!hasPreviousPage}
              onClick={() => hasPreviousPage && setPage(page - 1)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => hasNextPage && setPage(page + 1)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      <ArtworkModal
        isOpen={isArtworkOpen}
        design={selectedDesign}
        onClose={closeArtwork}
      />

      <JobDetailsPanel
        isOpen={isDetailsOpen}
        design={selectedDesign}
        onClose={closeDetails}
        onNotesSaved={(id, notes) => {
          const now = new Date().toISOString();
          setDesigns((items) =>
            items.map((d) =>
              d.id === id ? { ...d, notes, updatedAt: now } : d
            )
          );
          setSelectedDesign((d) =>
            d && d.id === id ? { ...d, notes, updatedAt: now } : d
          );
        }}
      />
    </div>
  );
};

export default DesignsPage;
