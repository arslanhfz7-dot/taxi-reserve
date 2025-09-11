"use client";

import { useMemo, useRef, useState } from "react";

type Reservation = {
  id: string;
  startAt: string;        // ISO
  endAt?: string | null;
  pax?: number | null;
  pickup?: string | null;
  dropoff?: string | null;
  notes?: string | null;
  status?: "upcoming" | "past" | "all"; // optional if you track it
};

type Props = {
  reservations: Reservation[];
  onDeleteMany?: (ids: string[]) => Promise<void> | void;
};

export default function ReservationList({ reservations, onDeleteMany }: Props) {
  // UI states
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Simple filters
  const [showKind, setShowKind] = useState<"all"|"upcoming"|"past">("all");
  const [search, setSearch] = useState("");

  // Derived list: sort desc by startAt, then filter
  const list = useMemo(() => {
    const sorted = [...reservations].sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );

    const now = Date.now();
    return sorted.filter((r) => {
      const starts = new Date(r.startAt).getTime();
      const passesKind =
        showKind === "all" ? true :
        showKind === "upcoming" ? starts >= now :
        starts < now;

      const hay = `${r.pickup ?? ""} ${r.dropoff ?? ""} ${r.notes ?? ""}`.toLowerCase();
      const passesSearch = search.trim()
        ? hay.includes(search.trim().toLowerCase())
        : true;

      return passesKind && passesSearch;
    });
  }, [reservations, showKind, search]);

  function toggleOpen(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }
  function enterSelectMode(id?: string) {
    setSelectMode(true);
    if (id) toggleSelect(id);
  }
  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }
  function selectAll() {
    setSelected(new Set(list.map((r) => r.id)));
  }
  async function handleDelete() {
    if (!selected.size || !onDeleteMany) return;
    const ids = [...selected];
    await onDeleteMany(ids);
    exitSelectMode();
  }

  // Long-press (iOS-friendly)
  const timers = useRef<Record<string, any>>({});
  function onPressStart(id: string) {
    timers.current[id] = setTimeout(() => enterSelectMode(id), 500);
  }
  function onPressEnd(id: string) {
    const t = timers.current[id];
    if (t) clearTimeout(t);
  }

  return (
    <div className="container-mobile">
      {/* Sticky header with Filters button */}
      <div className="mobile-header">
        <div className="h-title">Reservations</div>
        <div className="h-actions">
          <button className="btn" onClick={() => setFiltersOpen((v) => !v)}>
            {filtersOpen ? "Close Filters" : "Filters"}
          </button>
        </div>
      </div>

      {/* Slide-down filter sheet (only visible when opened) */}
      <div className={`filtersheet ${filtersOpen ? "open" : ""}`}>
        <div className="filtersheet-inner">
          <div className="filter-grid">
            <div>
              <div className="label">Show</div>
              <select value={showKind} onChange={(e) => setShowKind(e.target.value as any)}>
                <option value="all">All</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            </div>
            <div>
              <div className="label">Search</div>
              <input
                className="input"
                placeholder="Pickup, drop-off or notes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="empty" style={{paddingTop:24}}>No reservations match your filters.</div>
      )}

      {/* List */}
      {list.map((r) => {
        const d = new Date(r.startAt);
        const date = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
        const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
        const isOpen = openId === r.id;
        const isSel = selected.has(r.id);

        return (
          <div key={r.id} style={{ borderRadius: 16, overflow: "hidden" }}>
            <div
              className={`r-row ${isOpen ? "active" : ""}`}
              onMouseDown={() => onPressStart(r.id)}
              onMouseUp={() => onPressEnd(r.id)}
              onTouchStart={() => onPressStart(r.id)}
              onTouchEnd={() => onPressEnd(r.id)}
              onClick={() => (selectMode ? toggleSelect(r.id) : toggleOpen(r.id))}
              role="button"
              aria-expanded={isOpen}
            >
              {/* Select dot */}
              <div
                className={`sel-dot ${isSel ? "on" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  selectMode ? toggleSelect(r.id) : enterSelectMode(r.id);
                }}
                aria-label={isSel ? "Deselect" : "Select"}
              >
                {isSel ? "✓" : ""}
              </div>

              {/* Main text (date/time only) */}
              <div style={{ display: "grid", gap: 2 }}>
                <div className="date">{date}</div>
                <div className="time">{time}</div>
              </div>

              {/* Chevron */}
              <svg className={`chev ${isOpen ? "open" : ""}`} viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
              </svg>
            </div>

            {/* Details */}
            <div className={`panel ${isOpen ? "open" : ""}`}>
              <div>
                {r.pickup && <div><b>Pickup:</b> {r.pickup}</div>}
                {r.dropoff && <div><b>Drop-off:</b> {r.dropoff}</div>}
                {r.pax != null && <div><b>Pax:</b> {r.pax}</div>}
                {r.endAt && (
                  <div>
                    <b>Ends:</b>{" "}
                    {new Date(r.endAt).toLocaleString(undefined, {
                      hour: "2-digit", minute: "2-digit",
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </div>
                )}
                {r.notes && <div style={{ marginTop: 6 }}>{r.notes}</div>}
              </div>
            </div>
          </div>
        );
      })}

      {/* Sticky bottom action bar (selection mode) */}
      {selectMode && (
        <div className="actionbar">
          <div style={{ color: "var(--ink-dim)", paddingLeft: 2 }}>
            {selected.size} selected
          </div>
          <button className="btn" onClick={selectAll}>Select all</button>
          <button className="btn danger" onClick={handleDelete}>Delete</button>
        </div>
      )}
    </div>
  );
}
