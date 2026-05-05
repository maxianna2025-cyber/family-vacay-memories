import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/hooks/useAppSettings";

const TOTAL = 6;

export function HeroHeader() {
  const settings = useAppSettings();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "route_progress")
      .maybeSingle()
      .then(({ data }) => {
        const n = parseInt(data?.value ?? "0", 10);
        if (!Number.isNaN(n)) setProgress(n);
      });
  }, []);

  const status =
    progress === 0 ? "ГОТОВНОСТЬ" : progress >= TOTAL ? "ЗАВЕРШЕНО" : "В ПУТИ";

  return (
    <section className="border-2 border-primary/40 bg-card overflow-hidden">
      <div className="h-1 bg-primary" />
      <div className="flex items-center gap-3 p-3 sm:p-4">
        {/* Emblem */}
        <div className="shrink-0">
          <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14" aria-hidden="true">
            <circle cx="32" cy="32" r="30" fill="var(--emercom-blue)" stroke="var(--emercom-orange)" strokeWidth="2" />
            <polygon
              points="32,8 38,26 56,26 41,37 47,55 32,44 17,55 23,37 8,26 26,26"
              fill="var(--emercom-orange)"
            />
            <circle cx="32" cy="32" r="6" fill="var(--emercom-blue)" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-primary">
            МЧС России · Миссия 2026
          </div>
          <h1 className="text-base sm:text-2xl uppercase tracking-widest leading-tight truncate">
            {settings.app_title}
          </h1>
          <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
            {settings.app_subtitle}
          </div>
        </div>

        {/* status */}
        <div className="shrink-0 border-l border-primary/40 pl-3 text-right">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Статус</div>
          <div className="text-sm sm:text-base uppercase tracking-widest text-primary">{status}</div>
          <div className="text-[10px] text-muted-foreground tabular-nums">
            {progress}/{TOTAL} точек
          </div>
        </div>
      </div>
    </section>
  );
}
