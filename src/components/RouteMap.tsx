import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const W = 800;
const H = 260;

// Equirectangular projection — tighter bbox to fit a compact strip.
const LON_MIN = 78;
const LON_MAX = 135;
const LAT_MIN = 12;
const LAT_MAX = 60;

const project = (lon: number, lat: number): [number, number] => {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
  return [x, y];
};

type Stop = {
  key: string;
  name: string;
  date_idx: number; // index into dates[]
  date_idx2?: number; // optional second date for merged stop
  lon: number;
  lat: number;
  ox: number;
  oy: number;
  anchor: "start" | "end" | "middle";
};

// 5 visual stops; Hong Kong + Macau merged (geographically identical at this scale).
const STOPS: Stop[] = [
  { key: "krk", name: "КРАСНОЯРСК", date_idx: 0, lon: 92.9, lat: 56.0, ox: 10, oy: -10, anchor: "start" },
  { key: "pek", name: "ПЕКИН", date_idx: 1, lon: 116.4, lat: 39.9, ox: 10, oy: -10, anchor: "start" },
  { key: "hk", name: "ГОНКОНГ / МАКАО", date_idx: 2, date_idx2: 4, lon: 113.8, lat: 22.3, ox: 10, oy: 4, anchor: "start" },
  { key: "dn", name: "ДАНАНГ", date_idx: 3, lon: 108.2, lat: 16.0, ox: -10, oy: 4, anchor: "end" },
];

// Simplified land contours — only the bits relevant to the route.
const LAND: string[] = [
  // Russia strip across the top
  polyFromLatLon([
    [78, 60], [135, 60], [135, 50], [128, 47], [120, 49], [110, 50],
    [100, 51], [90, 52], [80, 54],
  ]),
  // China + Indochina mainland (one soft blob)
  polyFromLatLon([
    [78, 42], [88, 42], [100, 43], [115, 42], [122, 40], [122, 31],
    [121, 25], [115, 22], [110, 21], [108, 22], [109, 18], [109, 14],
    [107, 11], [104, 10], [102, 13], [100, 14], [98, 17], [97, 22],
    [94, 28], [88, 30], [80, 33],
  ]),
];

function polyFromLatLon(points: [number, number][]): string {
  const pts = points.map(([lon, lat]) => {
    const [x, y] = project(lon, lat);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M ${pts.join(" L ")} Z`;
}

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
            if (!Number.isNaN(n)) setProgress(Math.max(0, Math.min(STOPS.length, n)));
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
            if (!Number.isNaN(n)) setProgress(Math.max(0, Math.min(STOPS.length, n)));
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

  const points = STOPS.map((s) => {
    const [x, y] = project(s.lon, s.lat);
    return { ...s, x, y };
  });

  // Straight segments
  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    "",
  );

  const activeIdx = progress < STOPS.length ? progress : STOPS.length - 1;
  const status =
    progress === 0 ? "ГОТОВНОСТЬ" : progress >= STOPS.length ? "ЗАВЕРШЕНО" : "В ПУТИ";

  return (
    <section className="border-2 border-primary/40 bg-card">
      <div className="border-b border-primary/40 bg-secondary px-3 py-1.5 flex items-center justify-between gap-2">
        <h2 className="text-xs uppercase tracking-widest text-primary truncate">
          ◉ Карта операции · Восточная Азия
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-primary whitespace-nowrap">
          {status}
        </span>
      </div>

      <div className="relative bg-[hsl(220_30%_9%)]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Карта маршрута"
        >
          <defs>
            <radialGradient id="rm-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--emercom-orange)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--emercom-orange)" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width={W} height={H} fill="hsl(220 30% 9%)" />

          {LAND.map((d, i) => (
            <path key={i} d={d} fill="hsl(220 18% 18%)" />
          ))}

          {/* route line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--emercom-orange)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            opacity="0.5"
          />
          {progress > 0 && (
            <path
              d={points
                .slice(0, Math.min(progress + 1, points.length))
                .reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), "")}
              fill="none"
              stroke="var(--emercom-orange)"
              strokeWidth="2"
              opacity="0.95"
            />
          )}

          {points.map((p, i) => {
            const isDone = i < progress;
            const isActive = i === progress && progress < STOPS.length;
            const dateText = p.date_idx2 != null
              ? `${dates[p.date_idx]} · ${dates[p.date_idx2]}`
              : dates[p.date_idx];
            return (
              <g key={p.key}>
                {isActive && (
                  <circle cx={p.x} cy={p.y} r="16" fill="url(#rm-pulse)">
                    <animate attributeName="r" values="10;22;10" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.15;0.9" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill={isDone || isActive ? "var(--emercom-orange)" : "hsl(220 30% 9%)"}
                  stroke="var(--emercom-orange)"
                  strokeWidth="2"
                />
                <text
                  x={p.x + p.ox}
                  y={p.y + p.oy}
                  fontSize="13"
                  fontWeight="700"
                  fill="var(--emercom-orange)"
                  fontFamily="'Roboto Mono', monospace"
                  style={{ letterSpacing: "0.08em" }}
                  textAnchor={p.anchor}
                >
                  {p.name}
                </text>
                <text
                  x={p.x + p.ox}
                  y={p.y + p.oy + 13}
                  fontSize="11"
                  fill="hsl(35 25% 75%)"
                  fontFamily="'Roboto Mono', monospace"
                  textAnchor={p.anchor}
                >
                  {dateText}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="border-t border-primary/30 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-2">
        <span>Старт {dates[0]}</span>
        <span className="text-primary truncate">
          {progress === 0
            ? "Готовность к выходу"
            : progress >= STOPS.length
              ? "Операция завершена"
              : `Сейчас: ${STOPS[activeIdx].name}`}
        </span>
        <span>Финиш {dates[5]}</span>
      </div>
    </section>
  );
}
