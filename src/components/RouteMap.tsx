import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ROUTE = [
  { name: "Красноярск", x: 410, y: 110, country: "RU" },
  { name: "Пекин", x: 510, y: 250, country: "CN" },
  { name: "Гонконг", x: 540, y: 360, country: "CN" },
  { name: "Дананг", x: 510, y: 410, country: "VN" },
  { name: "Макао", x: 532, y: 362, country: "CN" },
  { name: "Пекин", x: 510, y: 250, country: "CN" },
];

// Simplified land outlines for East Asia (path data in 700x500 viewBox)
const LAND_PATH =
  "M 50 60 L 700 60 L 700 130 L 660 160 L 640 200 L 620 230 L 600 260 L 590 290 L 580 320 L 570 350 L 555 380 L 545 410 L 530 430 L 510 445 L 480 435 L 460 420 L 445 395 L 430 370 L 420 340 L 410 310 L 405 285 L 400 260 L 380 240 L 350 230 L 320 225 L 290 230 L 260 245 L 230 260 L 200 270 L 170 275 L 140 270 L 110 255 L 80 230 L 60 200 L 50 170 Z";

const COUNTRY_LABELS = [
  { name: "РОССИЯ", x: 200, y: 110 },
  { name: "КАЗАХСТАН", x: 180, y: 230 },
  { name: "МОНГОЛИЯ", x: 360, y: 200 },
  { name: "КИТАЙ", x: 480, y: 320 },
  { name: "ВЬЕТНАМ", x: 500, y: 440 },
  { name: "ЯПОНИЯ", x: 660, y: 230 },
];

export function RouteMap() {
  const [progress, setProgress] = useState(0);
  const [dates, setDates] = useState<string[]>([
    "05.07", "07.07", "10.07", "13.07", "17.07", "20.07",
  ]);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key,value")
      .in("key", ["route_progress", "route_dates"])
      .then(({ data }) => {
        if (!data) return;
        for (const r of data) {
          if (r.key === "route_progress") {
            const n = parseInt(r.value ?? "0", 10);
            if (!Number.isNaN(n)) setProgress(Math.max(0, Math.min(ROUTE.length, n)));
          }
          if (r.key === "route_dates") {
            try {
              const arr = JSON.parse(r.value);
              if (Array.isArray(arr) && arr.length === 6) setDates(arr.map(String));
            } catch {}
          }
        }
      });

    const channel = supabase
      .channel("route-map")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        (payload: any) => {
          const k = payload?.new?.key;
          const v = payload?.new?.value;
          if (k === "route_progress") {
            const n = parseInt(v ?? "0", 10);
            if (!Number.isNaN(n)) setProgress(Math.max(0, Math.min(ROUTE.length, n)));
          }
          if (k === "route_dates") {
            try {
              const arr = JSON.parse(v);
              if (Array.isArray(arr) && arr.length === 6) setDates(arr.map(String));
            } catch {}
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const W = 700;
  const H = 500;

  // Build the route path with quadratic curves
  const pathD = ROUTE.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = ROUTE[i - 1];
    const mx = (prev.x + p.x) / 2;
    const my = (prev.y + p.y) / 2 - 8;
    return `${acc} Q ${mx} ${my} ${p.x} ${p.y}`;
  }, "");

  const activeIdx = progress < ROUTE.length ? progress : ROUTE.length - 1;
  const status =
    progress === 0 ? "ГОТОВНОСТЬ" : progress >= ROUTE.length ? "ЗАВЕРШЕНО" : "В ПУТИ";

  return (
    <section className="border-2 border-primary/40 bg-card">
      <div className="border-b border-primary/40 bg-secondary px-3 py-2 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-primary">◉ Карта операции</h2>
          <p className="text-[10px] text-secondary-foreground/70 uppercase tracking-wider">
            Восточная Азия · {progress}/{ROUTE.length} точек
          </p>
        </div>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-wider text-secondary-foreground/60">Статус</div>
          <div className="text-xs uppercase tracking-widest text-primary">{status}</div>
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Карта маршрута">
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--primary) / 0.05)" strokeWidth="1" />
            </pattern>
            <radialGradient id="map-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--emercom-orange)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--emercom-orange)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* sea background grid */}
          <rect x="0" y="0" width={W} height={H} fill="url(#map-grid)" />

          {/* land mass */}
          <path
            d={LAND_PATH}
            fill="hsl(var(--secondary) / 0.35)"
            stroke="hsl(var(--primary) / 0.25)"
            strokeWidth="1"
          />

          {/* country labels */}
          {COUNTRY_LABELS.map((c) => (
            <text
              key={c.name}
              x={c.x}
              y={c.y}
              fontSize="11"
              fill="hsl(var(--muted-foreground) / 0.7)"
              fontFamily="'Roboto Mono', monospace"
              style={{ letterSpacing: "0.2em" }}
              textAnchor="middle"
            >
              {c.name}
            </text>
          ))}

          {/* compass rose */}
          <g transform={`translate(${W - 50}, 50)`} opacity="0.6">
            <circle r="22" fill="none" stroke="var(--emercom-orange)" strokeWidth="1" />
            <line x1="0" y1="-22" x2="0" y2="22" stroke="var(--emercom-orange)" strokeWidth="0.8" />
            <line x1="-22" y1="0" x2="22" y2="0" stroke="var(--emercom-orange)" strokeWidth="0.8" />
            <polygon points="0,-22 -4,-10 4,-10" fill="var(--emercom-orange)" />
            <text x="0" y="-26" fontSize="9" fill="var(--emercom-orange)" textAnchor="middle" fontFamily="'Roboto Mono', monospace">N</text>
          </g>

          {/* stamp */}
          <g transform="translate(40, 460)" opacity="0.55">
            <rect x="-4" y="-14" width="120" height="22" fill="none" stroke="var(--emercom-orange)" strokeWidth="1" />
            <text x="56" y="0" fontSize="11" fill="var(--emercom-orange)" textAnchor="middle" fontFamily="'Roboto Mono', monospace" style={{ letterSpacing: "0.15em" }}>
              ИЮЛЬ 2026
            </text>
          </g>

          {/* route path */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--emercom-orange)"
            strokeWidth="2.2"
            strokeDasharray="6 5"
            opacity="0.8"
          />

          {/* points */}
          {ROUTE.slice(0, 5).map((p, i) => {
            const isDone = i < progress;
            const isActive = i === progress && progress < ROUTE.length;
            return (
              <g key={i}>
                {isActive && (
                  <circle cx={p.x} cy={p.y} r="22" fill="url(#map-pulse)">
                    <animate attributeName="r" values="14;28;14" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="8"
                  fill={isDone || isActive ? "var(--emercom-orange)" : "hsl(var(--background))"}
                  stroke="var(--emercom-orange)"
                  strokeWidth="2"
                />
                {isDone && (
                  <text x={p.x} y={p.y + 3} fontSize="10" fill="hsl(var(--background))" textAnchor="middle" fontWeight="700">
                    ✓
                  </text>
                )}
                <text
                  x={p.x + 12}
                  y={p.y - 6}
                  fontSize="12"
                  fontWeight="700"
                  fill="var(--emercom-orange)"
                  fontFamily="'Roboto Mono', monospace"
                  style={{ letterSpacing: "0.1em" }}
                >
                  {p.name.toUpperCase()}
                </text>
                <text
                  x={p.x + 12}
                  y={p.y + 8}
                  fontSize="10"
                  fill="hsl(var(--muted-foreground))"
                  fontFamily="'Roboto Mono', monospace"
                >
                  {dates[i]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="border-t border-primary/30 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-between">
        <span>◀ Старт: {dates[0]}</span>
        <span className="text-primary">
          {progress === 0
            ? "Готовность к выходу"
            : progress >= ROUTE.length
              ? "Операция завершена"
              : `Текущая: ${ROUTE[activeIdx].name} · ${dates[activeIdx]}`}
        </span>
        <span>Финиш: {dates[5]} ▶</span>
      </div>
    </section>
  );
}
