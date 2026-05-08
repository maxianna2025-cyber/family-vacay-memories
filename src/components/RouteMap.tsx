import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Stop = {
  key: string;
  name: string;
  date_idx: number;
};

const STOPS: Stop[] = [
  { key: "krk1", name: "КРАСНОЯРСК", date_idx: 0 },
  { key: "pek1", name: "ПЕКИН", date_idx: 1 },
  { key: "hk", name: "ГОНКОНГ", date_idx: 2 },
  { key: "dn", name: "ДАНАНГ", date_idx: 3 },
  { key: "mac", name: "МАКАО", date_idx: 4 },
  { key: "pek2", name: "ПЕКИН", date_idx: 5 },
  { key: "krk2", name: "КРАСНОЯРСК", date_idx: 6 },
];

const DEFAULT_DATES = ["05.07", "07.07", "10.07", "13.07", "17.07", "20.07", "22.07"];

export function RouteMap() {
  const [progress, setProgress] = useState(0);
  const [dates, setDates] = useState<string[]>(DEFAULT_DATES);

  useEffect(() => {
    const applyDates = (raw: string) => {
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length >= STOPS.length) {
          setDates(arr.slice(0, STOPS.length).map(String));
        }
      } catch {}
    };

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
          if (r.key === "route_dates") applyDates(r.value);
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
          if (k === "route_dates") applyDates(v);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeIdx = progress < STOPS.length ? progress : STOPS.length - 1;
  const status =
    progress === 0 ? "ГОТОВНОСТЬ" : progress >= STOPS.length ? "ЗАВЕРШЕНО" : "В ПУТИ";

  return (
    <section className="border-2 border-primary/40 bg-card">
      <div className="border-b border-primary/40 bg-secondary px-3 py-1.5 flex items-center justify-between gap-2">
        <h2 className="text-xs uppercase tracking-widest text-primary truncate">
          ◉ Маршрут операции
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-primary whitespace-nowrap">
          {status}
        </span>
      </div>

      <div className="px-2 py-3 sm:px-4 sm:py-4 overflow-x-auto">
        <div className="flex items-start min-w-[520px]">
          {STOPS.map((s, i) => {
            const isDone = i < progress;
            const isActive = i === progress && progress < STOPS.length;
            const isLast = i === STOPS.length - 1;
            const segDone = i < progress;

            return (
              <div key={s.key} className="flex items-start flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0 w-0">
                  <div className="relative h-4 flex items-center justify-center">
                    {isActive && (
                      <span
                        className="absolute h-4 w-4 rounded-full bg-primary/40 animate-ping"
                        aria-hidden
                      />
                    )}
                    <span
                      className={
                        "relative h-3 w-3 rounded-full border-2 border-primary " +
                        (isDone || isActive ? "bg-primary" : "bg-card")
                      }
                    />
                  </div>
                  <div className="mt-2 text-center w-20 -mx-10">
                    <div
                      className={
                        "text-[10px] uppercase tracking-widest leading-tight " +
                        (isActive || isDone ? "text-primary" : "text-muted-foreground")
                      }
                    >
                      {s.name}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {dates[s.date_idx]}
                    </div>
                  </div>
                </div>

                {!isLast && (
                  <div className="flex-1 h-4 flex items-center px-1">
                    <div
                      className={
                        "h-px w-full " +
                        (segDone
                          ? "bg-primary"
                          : "border-t border-dashed border-primary/30 bg-transparent")
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
        <span>Финиш {dates[STOPS.length - 1]}</span>
      </div>
    </section>
  );
}
