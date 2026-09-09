"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getBoroughDetail,
  type BoroughSighting,
  type OverviewStats,
} from "@/app/actions";
import "@/app/hud.css";

const LAYOUT: Record<string, { x: number; y: number; isHub?: boolean }> = {
  Manhattan: { x: 300, y: 300, isHub: true },
  Brooklyn: { x: 410, y: 410 },
  Queens: { x: 470, y: 250 },
  Bronx: { x: 330, y: 120 },
  Staten_Island: { x: 130, y: 440 },
};

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function rand01(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function statusInfo(status: string) {
  if (status === "verified") return { key: "blue", label: "Confirmed" };
  if (status === "impersonator" || status === "deliberate_fake")
    return { key: "red", label: "Flagged" };
  return { key: "gold", label: "Unclear" };
}

type PositionedCase = BoroughSighting & { x: number; y: number; statusKey: string; statusLabel: string };

function layoutCases(borough: string, sightings: BoroughSighting[]): PositionedCase[] {
  const anchor = LAYOUT[borough];
  return sightings.map((s) => {
    const h = hashStr(s.sighting_id);
    const angle = rand01(h) * Math.PI * 2;
    const radiusBase = anchor.isHub ? 45 : 20;
    const radiusRange = anchor.isHub ? 55 : 70;
    const radius = radiusBase + rand01(h + 1) * radiusRange;
    const x = anchor.x + Math.cos(angle) * radius;
    const y = anchor.isHub
      ? anchor.y + Math.sin(angle) * radius * 0.6 + 20
      : anchor.y + Math.sin(angle) * radius;
    const status = statusInfo(s.verification_status);
    return { ...s, x, y, statusKey: status.key, statusLabel: status.label };
  });
}

export default function WebSenseHUD({ overview }: { overview: OverviewStats }) {
  const [clock, setClock] = useState("00:00:00");
  const [totalDisplay, setTotalDisplay] = useState(0);
  const [rateDisplay, setRateDisplay] = useState(0);
  const [activeBorough, setActiveBorough] = useState<string | null>(null);
  const [cases, setCases] = useState<PositionedCase[]>([]);
  const [selected, setSelected] = useState<PositionedCase | null>(null);
  const [bursts, setBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const dur = 900;
    const start = performance.now();
    let raf: number;
    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setTotalDisplay(Math.round(overview.totalSightings * eased));
      setRateDisplay(Math.round(overview.verifiedRate * 100 * eased));
      if (p < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [overview.totalSightings, overview.verifiedRate]);

  function toggleBorough(name: string) {
    if (activeBorough === name) {
      setActiveBorough(null);
      setCases([]);
      setSelected(null);
      return;
    }
    setActiveBorough(name);
    setSelected(null);
    startTransition(async () => {
      const detail = await getBoroughDetail(name, 0);
      setCases(layoutCases(name, detail.sightings));
    });
  }

  function selectCase(c: PositionedCase) {
    setSelected(c);
    setBursts((prev) => [...prev, { id: Date.now(), x: c.x, y: c.y }]);
  }


  return (
    <div className="websense">
      <div className="ws-hud">
        <span className="ws-tag ws-tag-left">NEW YORK CITY // TONIGHT</span>
        <span className="ws-tag ws-tag-badge">● LIVE</span>

        <header className="ws-statusbar ws-glass">
          <div className="ws-statusbar-left">
            <span className="ws-sense">SPIDER-SENSE: ACTIVE</span>
            <span>SECTOR: MANHATTAN GRID</span>
          </div>
          <div className="ws-statusbar-center">
            <h1 className="ws-glitch" data-text="SPIDEY-TRACKER">
              SPIDEY<em>-TRACKER</em>
            </h1>
            <p>18-Month Sighting Archive</p>
          </div>
          <div className="ws-statusbar-right">
            <div className="ws-signal">
              <span>NETWORK</span>
              <div className="ws-bars">
                <i /><i /><i /><i />
              </div>
            </div>
            <div className="ws-clock">{clock}</div>
          </div>
        </header>

        <div className="ws-readouts">
          <div className="ws-readout ws-glass">
            <span className="ws-label">Sightings Logged</span>
            <span className="ws-value">{totalDisplay.toLocaleString()}</span>
          </div>
          <div className="ws-readout ws-glass">
            <span className="ws-label">Confirmed Rate</span>
            <span className="ws-value blue">{rateDisplay}%</span>
          </div>
          <div className="ws-readout ws-glass">
            <span className="ws-label">Boroughs Webbed</span>
            <span className="ws-value">5 / 5</span>
          </div>
          <div className="ws-readout ws-glass">
            <span className="ws-label">Last Logged</span>
            <span className="ws-value">Jun 30, 2026</span>
          </div>
        </div>

        <main className="ws-main-grid">
          <section className="ws-web-panel ws-glass">
            <div className="ws-panel-label">
              <span>
                {activeBorough
                  ? `Web Scan — ${activeBorough.replace("_", " ")} (${
                      isPending ? "…" : cases.length
                    } cases)`
                  : "Web Scan — Tap a Borough"}
              </span>
              <span className="ws-legend-key">
                <i className="blue" />Confirmed <i className="gold" />Unclear <i className="red" />Flagged
              </span>
            </div>
            <div className="ws-web-panel-body">
              <div className="ws-web-wrap">
                <svg className="ws-web" viewBox="0 0 600 600">
                  <g>
                    {Object.entries(LAYOUT)
                      .filter(([, pos]) => !pos.isHub)
                      .map(([name, pos]) => (
                        <line
                          key={name}
                          className="ws-strand"
                          x1={300}
                          y1={300}
                          x2={pos.x}
                          y2={pos.y}
                        />
                      ))}
                  </g>
                  <g>
                    {activeBorough &&
                      !isPending &&
                      cases.map((c, i) => {
                        const anchor = LAYOUT[activeBorough];
                        if (anchor.isHub) return null;
                        return (
                          <line
                            key={c.sighting_id}
                            className="ws-strand-branch ws-case-strand"
                            style={{ animationDelay: `${i * 18}ms` }}
                            x1={anchor.x}
                            y1={anchor.y}
                            x2={c.x}
                            y2={c.y}
                          />
                        );
                      })}
                  </g>
                  <g>
                    {activeBorough &&
                      !isPending &&
                      cases.map((c, i) => (
                        <circle
                          key={c.sighting_id}
                          className={`ws-blip ws-case-blip ${c.statusKey} ${
                            selected?.sighting_id === c.sighting_id ? "selected" : ""
                          }`}
                          style={{ animationDelay: `${i * 18}ms` }}
                          cx={c.x}
                          cy={c.y}
                          r={6}
                          onClick={() => selectCase(c)}
                        />
                      ))}
                  </g>
                  <g>
                    {Object.entries(LAYOUT).map(([name, pos]) => (
                      <g
                        key={name}
                        className={`ws-borough-node ${activeBorough === name ? "active" : ""}`}
                        onClick={() => toggleBorough(name)}
                      >
                        <circle className="ws-b-ring" cx={pos.x} cy={pos.y} r={pos.isHub ? 22 : 15} />
                        <circle className="ws-b-core" cx={pos.x} cy={pos.y} r={pos.isHub ? 8 : 6} />
                      </g>
                    ))}
                    {Object.entries(LAYOUT).map(([name, pos]) => (
                      <text
                        key={name}
                        className={`ws-anchor-label ${activeBorough === name ? "active" : ""}`}
                        x={pos.x}
                        y={pos.isHub ? pos.y + 42 : pos.y - 20}
                        textAnchor="middle"
                        onClick={() => toggleBorough(name)}
                      >
                        {name.replace("_", " ").toUpperCase()}
                      </text>
                    ))}
                  </g>
                  <g>
                    {bursts.map((b) => (
                      <circle
                        key={b.id}
                        className="ws-burst"
                        cx={b.x}
                        cy={b.y}
                        r={10}
                        onAnimationEnd={() =>
                          setBursts((prev) => prev.filter((x) => x.id !== b.id))
                        }
                      />
                    ))}
                  </g>
                </svg>
              </div>
            </div>
          </section>

          <aside className="ws-target-panel ws-glass">
            <div className="ws-panel-label">
              <span>Sighting File</span>
            </div>
            <div className="ws-target-panel-body">
              {selected ? (
                <dl className="ws-target-data">
                  <div>
                    <dt>Borough</dt>
                    <dd>{activeBorough?.replace("_", " ")}</dd>
                  </div>
                  <div>
                    <dt>District</dt>
                    <dd>{selected.district.replace(/_/g, " ")}</dd>
                  </div>
                  <div>
                    <dt>Activity</dt>
                    <dd className="capitalize">{selected.report_type.replace(/_/g, " ")}</dd>
                  </div>
                  <div>
                    <dt>Witnesses</dt>
                    <dd>{selected.witness_count}</dd>
                  </div>
                  <div>
                    <dt>Logged</dt>
                    <dd>{new Date(selected.timestamp).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd className={`status-${selected.statusKey}`}>{selected.statusLabel}</dd>
                  </div>
                </dl>
              ) : (
                <div className="ws-target-empty">
                  NO NODE LOCKED
                  <span>Tap any dot on the web to pull its full report.</span>
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
