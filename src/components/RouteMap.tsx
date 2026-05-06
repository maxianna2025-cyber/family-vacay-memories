import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// viewBox
const W = 800;
const H = 560;

// Equirectangular projection for the East-Asia bounding box.
// lon range: 70..150, lat range: 10..62 (visible window).
const LON_MIN = 70;
const LON_MAX = 150;
const LAT_MIN = 8;
const LAT_MAX = 62;

const project = (lon: number, lat: number): [number, number] => {
  const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
  return [x, y];
};

// City data with real geographic coordinates.
type City = {
  name: string;
  lon: number;
  lat: number;
  // label offset and anchor — to avoid overlap
  ox: number;
  oy: number;
  anchor: "start" | "end" | "middle";
};

const ROUTE: City[] = [
  { name: "Красноярск", lon: 92.9, lat: 56.0, ox: 12, oy: -8, anchor: "start" },
  { name: "Пекин", lon: 116.4, lat: 39.9, ox: 12, oy: -8, anchor: "start" },
  { name: "Гонконг", lon: 114.2, lat: 22.3, ox: 14, oy: 4, anchor: "start" },
  { name: "Дананг", lon: 108.2, lat: 16.0, ox: -10, oy: 4, anchor: "end" },
  { name: "Макао", lon: 113.5, lat: 22.2, ox: -10, oy: -10, anchor: "end" },
  { name: "Пекин", lon: 116.4, lat: 39.9, ox: 12, oy: -8, anchor: "start" },
];

// Simplified country silhouettes — recognizable, geographically anchored.
// Each polygon is a rough outline of the landmass within our bbox.
const COUNTRIES: { name: string; labelLon: number; labelLat: number; path: string }[] = [
  {
    // Russia (south Siberia strip across the top)
    name: "РОССИЯ",
    labelLon: 95,
    labelLat: 58,
    path: polyFromLatLon([
      [70, 62], [150, 62], [150, 50], [140, 48], [130, 47], [120, 50], [110, 51],
      [100, 52], [90, 53], [80, 54], [70, 56],
    ]),
  },
  {
    // Mongolia
    name: "МОНГОЛИЯ",
    labelLon: 103,
    labelLat: 46,
    path: polyFromLatLon([
      [88, 49], [120, 50], [120, 42], [110, 42], [100, 42], [90, 44],
    ]),
  },
  {
    // Kazakhstan (sliver, west edge)
    name: "КАЗАХСТАН",
    labelLon: 75,
    labelLat: 48,
    path: polyFromLatLon([
      [70, 55], [88, 50], [88, 41], [70, 42],
    ]),
  },
  {
    // China main landmass
    name: "КИТАЙ",
    labelLon: 105,
    labelLat: 33,
    path: polyFromLatLon([
      [73, 41], [88, 41], [110, 42], [120, 42], [122, 40], [122, 31],
      [121, 25], [115, 22], [110, 21], [108, 22], [102, 22], [98, 24],
      [97, 28], [94, 29], [88, 30], [80, 32], [75, 36],
    ]),
  },
  {
    // Korea peninsula
    name: "КОРЕЯ",
    labelLon: 128,
    labelLat: 37,
    path: polyFromLatLon([
      [125, 38.5], [129, 38.5], [129.5, 35], [127, 34.5], [125, 36],
    ]),
  },
  {
    // Vietnam strip
    name: "ВЬЕТНАМ",
    labelLon: 106,
    labelLat: 12,
    path: polyFromLatLon([
      [102, 22], [105, 22], [108, 21], [109, 18], [109, 14], [107, 11],
      [106, 9], [104, 9], [105, 13], [104, 17], [102, 19],
    ]),
  },
  {
    // Laos / Thailand mass (just for context, no label)
    name: "",
    labelLon: 0,
    labelLat: 0,
    path: polyFromLatLon([
      [97, 21], [102, 22], [104, 17], [102, 13], [99, 10], [98, 14], [97, 18],
    ]),
  },
  {
    // Japan — main island Honshu (simplified)
    name: "ЯПОНИЯ",
    labelLon: 138,
    labelLat: 36,
    path: polyFromLatLon([
      [131, 34], [135, 34.5], [140, 36], [141, 39], [141, 41], [144, 43],
      [142, 44], [140, 42], [137, 37], [133, 34],
    ]),
  },
  {
    // Hokkaido (small)
    name: "",
    labelLon: 0,
    labelLat: 0,
    path: polyFromLatLon([
      [140, 45], [144, 45], [145, 43], [142, 42], [140, 43],
    ]),
  },
  {
    // Taiwan
    name: "",
    labelLon: 0,
    labelLat: 0,
    path: polyFromLatLon([
      [120, 25], [122, 25], [122, 22], [120, 22],
    ]),
  },
  {
    // Philippines (sketch)
    name: "ФИЛИППИНЫ",
    labelLon: 122,
    labelLat: 13,
    path: polyFromLatLon([
      [120, 18], [122, 18], [124, 16], [125, 12], [123, 9], [121, 11], [120, 14],
    ]),
  },
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

  // Compute projected coords for cities once
  const points = ROUTE.map((c) => {
    const [x, y] = project(c.lon, c.lat);
    return { ...c, x, y };
  });

  // Build the route path with smooth quadratic curves
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const mx = (prev.x + p.x) / 2;
    const my = (prev.y + p.y) / 2 - 14;
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

      <div className="relative bg-[hsl(220_30%_8%)]">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full" role="img" aria-label="Карта маршрута Восточной Азии">
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--primary) / 0.06)" strokeWidth="1" />
            </pattern>
            <radialGradient id="map-pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--emercom-orange)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--emercom-orange)" stopOpacity="0" />
            </radialGradient>
            <filter id="label-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
            </filter>
          </defs>

          {/* sea background */}
          <rect x="0" y="0" width={W} height={H} fill="hsl(220 35% 10%)" />
          <rect x="0" y="0" width={W} height={H} fill="url(#map-grid)" />

          {/* land polygons */}
          {COUNTRIES.map((c, i) => (
            <path
              key={i}
              d={c.path}
              fill="hsl(35 25% 35% / 0.35)"
              stroke="hsl(35 25% 55% / 0.5)"
              strokeWidth="0.8"
              strokeLinejoin="round"
            />
          ))}

          {/* country labels */}
          {COUNTRIES.filter((c) => c.name).map((c, i) => {
            const [x, y] = project(c.labelLon, c.labelLat);
            return (
              <text
                key={`l-${i}`}
                x={x}
                y={y}
                fontSize="11"
                fill="hsl(35 30% 65% / 0.75)"
                fontFamily="'Roboto Mono', monospace"
                style={{ letterSpacing: "0.25em" }}
                textAnchor="middle"
              >
                {c.name}
              </text>
            );
          })}

          {/* compass */}
          <g transform={`translate(${W - 55}, 55)`} opacity="0.45">
            <circle r="24" fill="none" stroke="var(--emercom-orange)" strokeWidth="1" />
            <line x1="0" y1="-24" x2="0" y2="24" stroke="var(--emercom-orange)" strokeWidth="0.6" />
            <line x1="-24" y1="0" x2="24" y2="0" stroke="var(--emercom-orange)" strokeWidth="0.6" />
            <polygon points="0,-24 -4,-12 4,-12" fill="var(--emercom-orange)" />
            <text x="0" y="-30" fontSize="10" fill="var(--emercom-orange)" textAnchor="middle" fontFamily="'Roboto Mono', monospace">N</text>
          </g>

          {/* stamp */}
          <g transform={`translate(40, ${H - 30})`} opacity="0.4">
            <rect x="-6" y="-15" width="130" height="24" fill="none" stroke="var(--emercom-orange)" strokeWidth="1" />
            <text x="59" y="2" fontSize="11" fill="var(--emercom-orange)" textAnchor="middle" fontFamily="'Roboto Mono', monospace" style={{ letterSpacing: "0.2em" }}>
              ИЮЛЬ 2026
            </text>
          </g>

          {/* future segments (dim) */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--emercom-orange)"
            strokeWidth="2"
            strokeDasharray="6 5"
            opacity="0.35"
          />

          {/* completed segments (bright) — render only the path up to active */}
          {progress > 0 && (
            <path
              d={points.slice(0, Math.min(progress + 1, points.length)).reduce((acc, p, i, arr) => {
                if (i === 0) return `M ${p.x} ${p.y}`;
                const prev = arr[i - 1];
                const mx = (prev.x + p.x) / 2;
                const my = (prev.y + p.y) / 2 - 14;
                return `${acc} Q ${mx} ${my} ${p.x} ${p.y}`;
              }, "")}
              fill="none"
              stroke="var(--emercom-orange)"
              strokeWidth="2.4"
              strokeDasharray="6 5"
              opacity="0.95"
            />
          )}

          {/* points (skip the duplicate Beijing return at end) */}
          {points.slice(0, 5).map((p, i) => {
            const isDone = i < progress;
            const isActive = i === progress && progress < ROUTE.length;
            // Label box dimensions
            const labelText = p.name.toUpperCase();
            const dateText = dates[i] ?? "";
            const charW = 7.2;
            const boxW = Math.max(labelText.length, dateText.length) * charW + 12;
            const boxH = 30;
            const lx = p.anchor === "end" ? p.x + p.ox - boxW : p.x + p.ox;
            const ly = p.y + p.oy - 18;

            return (
              <g key={i}>
                {/* leader line from point to label box */}
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={p.anchor === "end" ? lx + boxW : lx}
                  y2={ly + boxH / 2}
                  stroke="var(--emercom-orange)"
                  strokeWidth="0.8"
                  opacity="0.5"
                />

                {isActive && (
                  <circle cx={p.x} cy={p.y} r="22" fill="url(#map-pulse)">
                    <animate attributeName="r" values="14;30;14" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.9;0.15;0.9" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* outer ring */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="9"
                  fill="hsl(220 35% 10%)"
                  stroke="var(--emercom-orange)"
                  strokeWidth="2"
                />
                {/* inner */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill={isDone || isActive ? "var(--emercom-orange)" : "transparent"}
                />
                {isDone && (
                  <text x={p.x} y={p.y + 3} fontSize="9" fill="hsl(220 35% 10%)" textAnchor="middle" fontWeight="800">
                    ✓
                  </text>
                )}

                {/* label box */}
                <rect
                  x={lx}
                  y={ly}
                  width={boxW}
                  height={boxH}
                  fill="hsl(220 35% 10% / 0.92)"
                  stroke="var(--emercom-orange)"
                  strokeWidth="1"
                />
                <text
                  x={p.anchor === "end" ? lx + boxW - 6 : lx + 6}
                  y={ly + 13}
                  fontSize="11"
                  fontWeight="700"
                  fill="var(--emercom-orange)"
                  fontFamily="'Roboto Mono', monospace"
                  style={{ letterSpacing: "0.1em" }}
                  textAnchor={p.anchor === "end" ? "end" : "start"}
                >
                  {labelText}
                </text>
                <text
                  x={p.anchor === "end" ? lx + boxW - 6 : lx + 6}
                  y={ly + 25}
                  fontSize="10"
                  fill="hsl(35 30% 75%)"
                  fontFamily="'Roboto Mono', monospace"
                  textAnchor={p.anchor === "end" ? "end" : "start"}
                >
                  {dateText}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="border-t border-primary/30 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-2">
        <span>◀ Старт: {dates[0]}</span>
        <span className="text-primary text-center">
          {progress === 0
            ? "Готовность к выходу"
            : progress >= ROUTE.length
              ? "Операция завершена"
              : `Сейчас: ${ROUTE[activeIdx].name} · ${dates[activeIdx]}`}
        </span>
        <span>Финиш: {dates[5]} ▶</span>
      </div>
    </section>
  );
}
