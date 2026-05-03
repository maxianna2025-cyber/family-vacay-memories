import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const ROUTE = [
  { name: "Красноярск", note: "База" },
  { name: "Пекин", note: "Точка входа" },
  { name: "Гонконг", note: "Юг" },
  { name: "Дананг", note: "Море" },
  { name: "Макао", note: "Спецзадание" },
  { name: "Пекин", note: "Возвращение" },
];

export function RouteMap() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "route_progress")
      .maybeSingle()
      .then(({ data }) => {
        const n = parseInt(data?.value ?? "0", 10);
        if (!Number.isNaN(n)) setProgress(Math.max(0, Math.min(ROUTE.length, n)));
      });

    const channel = supabase
      .channel("route-progress")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings", filter: "key=eq.route_progress" },
        (payload: any) => {
          const n = parseInt(payload?.new?.value ?? "0", 10);
          if (!Number.isNaN(n)) setProgress(Math.max(0, Math.min(ROUTE.length, n)));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // SVG geometry — horizontal layout with 6 stops
  const W = 800;
  const H = 260;
  const padX = 60;
  const stepX = (W - padX * 2) / (ROUTE.length - 1);
  const yLine = 130;

  const points = ROUTE.map((p, i) => ({
    ...p,
    x: padX + stepX * i,
    y: yLine,
    state:
      i < progress ? ("done" as const) : i === progress ? ("active" as const) : ("pending" as const),
  }));

  const doneIdx = Math.max(0, progress - 1);
  const activeIdx = progress < ROUTE.length ? progress : ROUTE.length - 1;

  return (
    <section className="border-2 border-primary/40 bg-card">
      <div className="border-b border-primary/40 bg-secondary px-4 py-2 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm uppercase tracking-widest text-primary">◉ Маршрут операции</h2>
          <p className="text-xs text-secondary-foreground/80">
            Тактическая схема · {progress}/{ROUTE.length} точек пройдено
          </p>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-secondary-foreground/70">
          ▲ Цель: Саянская Вершина
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label="Маршрут операции">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="hsl(var(--primary) / 0.08)" strokeWidth="1" />
            </pattern>
            <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--emercom-orange)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--emercom-orange)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* radar grid */}
          <rect x="0" y="0" width={W} height={H} fill="url(#grid)" />

          {/* corner brackets */}
          {[
            [10, 10, 1, 1], [W - 10, 10, -1, 1], [10, H - 10, 1, -1], [W - 10, H - 10, -1, -1],
          ].map(([x, y, dx, dy], i) => (
            <g key={i} stroke="var(--emercom-orange)" strokeWidth="1.5" fill="none" opacity="0.5">
              <line x1={x} y1={y} x2={x + 14 * dx} y2={y} />
              <line x1={x} y1={y} x2={x} y2={y + 14 * dy} />
            </g>
          ))}

          {/* Pending dashed segments */}
          {points.slice(0, -1).map((p, i) => {
            const next = points[i + 1];
            const isDone = i < doneIdx;
            const isActive = i === doneIdx && progress > 0 && progress < ROUTE.length;
            return (
              <line
                key={i}
                x1={p.x}
                y1={p.y}
                x2={next.x}
                y2={next.y}
                stroke={isDone || isActive ? "var(--emercom-orange)" : "hsl(var(--muted-foreground) / 0.4)"}
                strokeWidth={isDone || isActive ? 3 : 1.5}
                strokeDasharray={isDone || isActive ? "0" : "4 6"}
                opacity={isDone || isActive ? 1 : 0.6}
              />
            );
          })}

          {/* Direction arrows on completed segments */}
          {points.slice(0, -1).map((p, i) => {
            if (i >= Math.max(doneIdx, 0)) return null;
            const next = points[i + 1];
            const mx = (p.x + next.x) / 2;
            const my = (p.y + next.y) / 2;
            return (
              <polygon
                key={`arr-${i}`}
                points={`${mx - 6},${my - 5} ${mx + 6},${my} ${mx - 6},${my + 5}`}
                fill="var(--emercom-orange)"
              />
            );
          })}

          {/* Points */}
          {points.map((p, i) => {
            const isActive = p.state === "active" && progress < ROUTE.length;
            const isDone = p.state === "done";
            return (
              <g key={i}>
                {isActive && (
                  <circle cx={p.x} cy={p.y} r="28" fill="url(#pulse)">
                    <animate attributeName="r" values="20;36;20" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="14"
                  fill={isDone || isActive ? "var(--emercom-orange)" : "hsl(var(--background))"}
                  stroke={isDone || isActive ? "var(--emercom-orange)" : "hsl(var(--muted-foreground) / 0.6)"}
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill={isDone || isActive ? "hsl(var(--background))" : "hsl(var(--muted-foreground))"}
                  fontFamily="'Roboto Mono', monospace"
                >
                  {isDone ? "✓" : i + 1}
                </text>

                {/* City label */}
                <text
                  x={p.x}
                  y={p.y - 28}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill={isDone || isActive ? "var(--emercom-orange)" : "hsl(var(--muted-foreground))"}
                  fontFamily="'Roboto Mono', monospace"
                  style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
                >
                  {p.name}
                </text>
                <text
                  x={p.x}
                  y={p.y + 40}
                  textAnchor="middle"
                  fontSize="9"
                  fill="hsl(var(--muted-foreground))"
                  fontFamily="'Roboto Mono', monospace"
                  style={{ textTransform: "uppercase", letterSpacing: "0.15em" }}
                >
                  {p.note}
                </text>
                <text
                  x={p.x}
                  y={p.y + 54}
                  textAnchor="middle"
                  fontSize="8"
                  fill="hsl(var(--primary) / 0.6)"
                  fontFamily="'Roboto Mono', monospace"
                >
                  {String(i + 1).padStart(2, "0")}/06
                </text>
              </g>
            );
          })}
        </svg>

        <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>◀ Старт</span>
          <span className="text-primary">
            {progress === 0
              ? "Готовность к выходу"
              : progress >= ROUTE.length
                ? "Операция завершена"
                : `Текущая точка: ${ROUTE[activeIdx].name}`}
          </span>
          <span>Финиш ▶</span>
        </div>
      </div>
    </section>
  );
}
