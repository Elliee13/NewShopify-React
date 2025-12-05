import React, { useEffect, useState } from 'react';
import type { Design, DesignStatus } from '../../../types';
import { fetchDesigns, updateDesignStatus } from '../../api/designs';
import StatusDropdown from '../StatusDropdown';
import ArtworkModal from '../ArtworkModal';

const DesignsPage: React.FC = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [statusFilter, setStatusFilter] = useState<DesignStatus | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);

  const [total, setTotal] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Artwork modal state
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [isArtworkOpen, setIsArtworkOpen] = useState(false);

  // Load designs whenever filters or pagination change
  useEffect(() => {
    let cancelled = false;

    async function loadDesigns() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchDesigns({
          status: statusFilter,
          search: search || undefined,
          sort: 'created_desc',
          page,
          perPage,
        });

        if (cancelled) return;

        setDesigns(res.data);
        setTotal(res.pageInfo.total);
        setHasNextPage(res.pageInfo.hasNextPage);
        setHasPreviousPage(res.pageInfo.hasPreviousPage);
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
  }, [statusFilter, search, page, perPage]);

  // Status filter button handler
  const handleStatusClick = (status: DesignStatus | 'all') => {
    setStatusFilter(status);
    setPage(1);
  };

  // Status dropdown handler (optimistic update)
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

  // Artwork modal handlers
  const openArtwork = (design: Design) => {
    setSelectedDesign(design);
    setIsArtworkOpen(true);
  };

  const closeArtwork = () => {
    setIsArtworkOpen(false);
    setSelectedDesign(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Print Jobs</h2>
        <p className="text-sm text-slate-600">
          Jobs pulled from the designs database. Powered by <code>/api/designs</code>.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'pending', 'printing', 'completed'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusClick(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                statusFilter === status
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {status === 'all'
                ? 'All'
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by product, color, size…"
            className="h-9 w-64 border border-slate-200 rounded-md px-3 text-sm focus:ring-2 focus:ring-slate-300"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="text-xs text-slate-600 flex justify-between items-center">
        <div>
          {loading && <span>Loading jobs…</span>}
          {!loading && !error && (
            <span>
              Showing <strong>{designs.length}</strong> of{' '}
              <strong>{total}</strong> jobs
            </span>
          )}
          {error && <span className="text-red-600">{error}</span>}
        </div>

        <div className="flex gap-2">
          <span>Page {page}</span>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm w-full">
        {loading && (
          <div className="p-4 text-sm text-slate-600">Loading jobs…</div>
        )}

        {!loading && error && (
          <div className="p-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && designs.length === 0 && (
          <div className="p-4 text-sm text-slate-600">
            No jobs found for this filter.
          </div>
        )}

        {!loading && !error && designs.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold text-slate-700 w-40">
                    Created
                  </th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-700">
                    Product / Variant
                  </th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-700 w-14">
                    Qty
                  </th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-700 w-32">
                    Status
                  </th>
                  <th className="text-left px-4 py-2 font-semibold text-slate-700 w-32">
                    Artwork
                  </th>
                  <th className="text-right px-4 py-2 font-semibold text-slate-700 w-40">
                    Checkout
                  </th>
                </tr>
              </thead>
              <tbody>
                {designs.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b last:border-b-0 border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-2 align-top text-slate-600 text-xs break-words">
                      {d.createdAt
                        ? new Date(d.createdAt).toLocaleString()
                        : '—'}
                    </td>

                    <td className="px-4 py-2 align-top">
                      <div className="text-xs font-semibold text-slate-900 break-all">
                        {d.productId}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {d.color || '—'} • {d.size || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Variant: {d.variantId}
                      </div>
                    </td>

                    <td className="px-4 py-2 align-top text-slate-800 text-sm">
                      {d.quantity}
                    </td>

                    <td className="px-4 py-2 align-top">
                      <StatusDropdown
                        value={d.status}
                        disabled={updatingId === d.id}
                        onChange={(next) => handleStatusChange(d.id, next)}
                      />
                    </td>

                    <td className="px-4 py-2 align-top">
                      {d.artworkUrl ? (
                        <button
                          type="button"
                          onClick={() => openArtwork(d)}
                          className="inline-flex items-center px-2 py-1 text-[11px] border border-slate-200 rounded-md hover:bg-slate-50"
                        >
                          View artwork
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          No file
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-2 align-top text-right">
                      {d.checkoutUrl ? (
                        <a
                          href={d.checkoutUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center px-2 py-1 text-[11px] border border-slate-200 rounded-md hover:bg-slate-50"
                        >
                          Open checkout
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination footer */}
      {!loading && !error && (
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div>Page {page}</div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!hasPreviousPage}
              onClick={() => hasPreviousPage && setPage(page - 1)}
              className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => hasNextPage && setPage(page + 1)}
              className="px-2 py-1 rounded border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Artwork Modal */}
      <ArtworkModal
        isOpen={isArtworkOpen}
        design={selectedDesign}
        onClose={closeArtwork}
      />
    </div>
  );
};

export default DesignsPage;
