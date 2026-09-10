"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InvestigationData } from "@/app/actions";
import "@/app/hud.css";

const LAT_MIN = 40.48;
const LAT_MAX = 40.93;
const LON_MIN = -74.27;
const LON_MAX = -73.69;

const STATUS_COLOR: Record<string, [number, number, number]> = {
  verified: [52, 226, 184], // cyan/green
  unclear: [246, 196, 83], // amber
  flagged: [194, 91, 86], // red/gray
};
const STATUS_ORDER = ["verified", "unclear", "flagged"] as const;

const DIM_OPACITY = 0.05;
const EASE = 0.12;
const HIT_RADIUS_PX = 22;

type Filters = {
  verifiedOnly: boolean;
  lateNightOnly: boolean;
  firstOfDayOnly: boolean;
  lastOfDayOnly: boolean;
  clearWxOnly: boolean;
};

const DEFAULT_FILTERS: Filters = {
  verifiedOnly: false,
  lateNightOnly: false,
  firstOfDayOnly: false,
  lastOfDayOnly: false,
  clearWxOnly: false,
};

export default function InvestigationView({ data }: { data: InvestigationData }) {
  const { points, districts, totalCount } = data;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showDistricts, setShowDistricts] = useState(false);
  const [guessDistrict, setGuessDistrict] = useState<string>("");
  const [locked, setLocked] = useState(false);

  // Precomputed, per-point typed arrays — built once from the fetched data.
  const geo = useMemo(() => {
    const n = points.length;
    const lonNorm = new Float32Array(n);
    const latNorm = new Float32Array(n);
    const statusIdx = new Uint8Array(n);
    const lateNight = new Uint8Array(n);
    const firstOfDay = new Uint8Array(n);
    const lastOfDay = new Uint8Array(n);
    const clearWx = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      const p = points[i];
      lonNorm[i] = (p.lon - LON_MIN) / (LON_MAX - LON_MIN);
      latNorm[i] = (LAT_MAX - p.lat) / (LAT_MAX - LAT_MIN);
      statusIdx[i] = STATUS_ORDER.indexOf(p.status);
      lateNight[i] = p.lateNight ? 1 : 0;
      firstOfDay[i] = p.firstOfDay ? 1 : 0;
      lastOfDay[i] = p.lastOfDay ? 1 : 0;
      clearWx[i] = p.clearWx ? 1 : 0;
    }

    const indicesByStatus = STATUS_ORDER.map((_, statusI) => {
      const idx: number[] = [];
      for (let i = 0; i < n; i++) if (statusIdx[i] === statusI) idx.push(i);
      return Int32Array.from(idx);
    });

    return { n, lonNorm, latNorm, statusIdx, lateNight, firstOfDay, lastOfDay, clearWx, indicesByStatus };
  }, [points]);

  const opacityRef = useRef<Float32Array>(new Float32Array(geo.n).fill(1));
  const targetRef = useRef<Float32Array>(new Float32Array(geo.n).fill(1));
  const xsRef = useRef<Float32Array>(new Float32Array(geo.n));
  const ysRef = useRef<Float32Array>(new Float32Array(geo.n));

  const districtPixels = useMemo(() => {
    return districts.map((d) => ({
      ...d,
      lonNorm: (d.lon - LON_MIN) / (LON_MAX - LON_MIN),
      latNorm: (LAT_MAX - d.lat) / (LAT_MAX - LAT_MIN),
    }));
  }, [districts]);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = sizeRef.current;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#050308";
    ctx.fillRect(0, 0, w, h);

    const xs = xsRef.current;
    const ys = ysRef.current;
    const opacity = opacityRef.current;

    STATUS_ORDER.forEach((status, statusI) => {
      const [r, g, b] = STATUS_COLOR[status];
      const idx = geo.indicesByStatus[statusI];
      for (let k = 0; k < idx.length; k++) {
        const i = idx[k];
        const a = opacity[i];
        if (a <= 0.01) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(xs[i] - 1, ys[i] - 1, 2, 2);
      }
    });
    ctx.globalAlpha = 1;

    if (showDistricts) {
      for (const d of districtPixels) {
        const x = d.lonNorm * w;
        const y = d.latNorm * h;
        const radius = 8 + d.nightlife * 26;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(246,196,83,${0.08 + d.nightlife * 0.12})`;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(47,139,255,${0.15 + d.patrolActivity * 0.5})`;
        ctx.stroke();

        if (d.district === guessDistrict) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
          ctx.lineWidth = 2;
          ctx.strokeStyle = locked ? "#ff2d42" : "#ffffff";
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    const opacity = opacityRef.current;
    const target = targetRef.current;
    let maxDelta = 0;
    for (let i = 0; i < opacity.length; i++) {
      const d = target[i] - opacity[i];
      opacity[i] += d * EASE;
      if (Math.abs(d) > maxDelta) maxDelta = Math.abs(d);
    }
    draw();
    if (maxDelta > 0.002) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      rafRef.current = null;
    }
  }

  function startAnimation() {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(animate);
    }
  }

  // Resize: recompute pixel projection + redraw.
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      sizeRef.current = { w, h };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      const xs = xsRef.current;
      const ys = ysRef.current;
      for (let i = 0; i < geo.n; i++) {
        xs[i] = geo.lonNorm[i] * w;
        ys[i] = geo.latNorm[i] * h;
      }
      draw();
    }
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo]);

  const visibleCount = useMemo(() => {
    const anyActive =
      filters.verifiedOnly ||
      filters.lateNightOnly ||
      filters.firstOfDayOnly ||
      filters.lastOfDayOnly ||
      filters.clearWxOnly;
    if (!anyActive) return totalCount;

    let visible = 0;
    for (let i = 0; i < geo.n; i++) {
      let passes = true;
      if (filters.verifiedOnly && geo.statusIdx[i] !== 0) passes = false;
      if (filters.lateNightOnly && geo.lateNight[i] === 0) passes = false;
      if (filters.firstOfDayOnly && geo.firstOfDay[i] === 0) passes = false;
      if (filters.lastOfDayOnly && geo.lastOfDay[i] === 0) passes = false;
      if (filters.clearWxOnly && geo.clearWx[i] === 0) passes = false;
      if (passes) visible++;
    }
    return visible;
  }, [filters, geo, totalCount]);

  // Filters changed: recompute target opacities (imperative, on a ref — not
  // React state) and kick off the fade animation toward them.
  useEffect(() => {
    const target = targetRef.current;
    for (let i = 0; i < geo.n; i++) {
      let passes = true;
      if (filters.verifiedOnly && geo.statusIdx[i] !== 0) passes = false;
      if (filters.lateNightOnly && geo.lateNight[i] === 0) passes = false;
      if (filters.firstOfDayOnly && geo.firstOfDay[i] === 0) passes = false;
      if (filters.lastOfDayOnly && geo.lastOfDay[i] === 0) passes = false;
      if (filters.clearWxOnly && geo.clearWx[i] === 0) passes = false;
      target[i] = passes ? 1 : DIM_OPACITY;
    }
    startAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, geo]);

  // District overlay toggle / guess change just needs a redraw, no opacity animation.
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDistricts, guessDistrict, locked]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (locked || !showDistricts) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const { w, h } = sizeRef.current;

    let nearest: string | null = null;
    let nearestDist = HIT_RADIUS_PX;
    for (const d of districtPixels) {
      const dx = d.lonNorm * w - x;
      const dy = d.latNorm * h - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = d.district;
      }
    }
    if (nearest) setGuessDistrict(nearest);
  }

  function toggle(key: keyof Filters) {
    setFilters((f) => ({ ...f, [key]: !f[key] }));
  }

  return (
    <div className="websense flex-1 flex flex-col">
      <div className="ws-hud" style={{ flex: 1 }}>
        <header className="ws-statusbar ws-glass">
          <div className="ws-statusbar-left">
            <span className="ws-sense">SPIDER-SENSE: ACTIVE</span>
            <span>THE INVESTIGATION</span>
          </div>
          <div className="ws-statusbar-center">
            <h1 className="ws-glitch" data-text="THE PATTERN" style={{ fontSize: "clamp(24px,4vw,40px)" }}>
              THE <em>PATTERN</em>
            </h1>
            <p>Every logged sighting, at once</p>
          </div>
          <div className="ws-statusbar-right">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>
              {visibleCount.toLocaleString()} / {totalCount.toLocaleString()}
            </span>
            <span style={{ fontFamily: "var(--font-label)", fontSize: 11, color: "var(--hud-text-dim)" }}>
              VISIBLE
            </span>
          </div>
        </header>

        <div className="investigation-grid">
          <div className="investigation-canvas-wrap ws-glass" ref={wrapRef}>
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              style={{ display: "block", cursor: showDistricts && !locked ? "crosshair" : "default" }}
            />
          </div>

          <aside className="investigation-panel ws-glass">
            <div className="ws-panel-label">
              <span>Filters</span>
            </div>
            <div className="investigation-toggles">
              <ToggleRow
                label="Verified sightings only"
                checked={filters.verifiedOnly}
                onChange={() => toggle("verifiedOnly")}
              />
              <ToggleRow
                label="Late-night only (10pm–5am)"
                checked={filters.lateNightOnly}
                onChange={() => toggle("lateNightOnly")}
              />
              <ToggleRow
                label="First sighting of each day"
                checked={filters.firstOfDayOnly}
                onChange={() => toggle("firstOfDayOnly")}
              />
              <ToggleRow
                label="Last sighting of each day"
                checked={filters.lastOfDayOnly}
                onChange={() => toggle("lastOfDayOnly")}
              />
              <ToggleRow
                label="Clear visibility only"
                checked={filters.clearWxOnly}
                onChange={() => toggle("clearWxOnly")}
              />
              <div className="investigation-divider" />
              <ToggleRow
                label="Show district activity overlay"
                checked={showDistricts}
                onChange={() => setShowDistricts((v) => !v)}
              />
            </div>

            <div className="investigation-legend">
              <span><i style={{ background: "rgb(52,226,184)" }} /> Confirmed</span>
              <span><i style={{ background: "rgb(246,196,83)" }} /> Unclear</span>
              <span><i style={{ background: "rgb(194,91,86)" }} /> Flagged</span>
            </div>

            <div className="ws-panel-label" style={{ marginTop: 20 }}>
              <span>Lock In Your Theory</span>
            </div>
            <p className="investigation-guess-copy">
              Toggle on the district overlay, then click a district — or pick one below — as your
              theory for where the hidden base might be.
            </p>
            <select
              className="investigation-select"
              value={guessDistrict}
              disabled={locked}
              onChange={(e) => setGuessDistrict(e.target.value)}
            >
              <option value="">— Select a district —</option>
              {districts.map((d) => (
                <option key={d.district} value={d.district}>
                  {d.district.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            {!locked ? (
              <button
                type="button"
                className="title-menu-btn primary investigation-lock-btn"
                disabled={!guessDistrict}
                onClick={() => setLocked(true)}
              >
                Lock In My Theory
              </button>
            ) : (
              <div className="investigation-result">
                <p>
                  Theory locked: <strong>{guessDistrict.replace(/_/g, " ")}</strong>
                </p>
                <p className="investigation-result-note">
                  Be honest with yourself here: there is no published correct answer for this.
                  Mission 05 in this dataset has no ground truth attached — your read on the
                  pattern is a genuine, open theory, not a quiz answer.
                </p>
                <button
                  type="button"
                  className="title-menu-btn investigation-lock-btn"
                  onClick={() => setLocked(false)}
                >
                  Reconsider
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="investigation-toggle-row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`investigation-switch ${checked ? "on" : ""}`}
        onClick={onChange}
      >
        <span className="investigation-switch-knob" />
      </button>
    </label>
  );
}
