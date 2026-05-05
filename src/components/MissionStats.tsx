import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";

export function MissionStats() {
  const [progress, setProgress] = useState(0);
  const [photos, setPhotos] = useState(0);
  const [videos, setVideos] = useState(0);
  const [tasks, setTasks] = useState(0);

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
    api.listPhotos().then((all) => {
      setPhotos(all.filter((p) => (p.media_type ?? "image") === "image").length);
      setVideos(all.filter((p) => p.media_type === "video").length);
    });
    api.listTasks().then((all) => setTasks(all.length));
  }, []);

  const pct = Math.round((progress / 6) * 100);

  const items = [
    { label: "Точек пройдено", value: `${progress}/6` },
    { label: "Прогресс", value: `${pct}%` },
    { label: "Фото", value: photos },
    { label: "Видео", value: videos },
    { label: "Заданий", value: tasks },
  ];

  return (
    <section className="border-2 border-primary/40 bg-card">
      <div className="border-b border-primary/40 bg-secondary px-3 py-2">
        <h2 className="text-sm uppercase tracking-widest text-primary">⛨ Статус миссии</h2>
      </div>
      <div className="grid grid-cols-3 gap-px bg-primary/20 sm:grid-cols-5">
        {items.map((it) => (
          <div key={it.label} className="bg-card p-3 text-center">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {it.label}
            </div>
            <div className="mt-1 text-xl font-bold text-primary tabular-nums">{it.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
