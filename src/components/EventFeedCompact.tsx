import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { api, type Photo } from "@/lib/api";

function initial(name: string) {
  return (name?.trim()?.[0] || "?").toUpperCase();
}

function colorFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${h}, 60%, 45%)`;
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return sameDay ? `сегодня, ${hh}:${mm}` : d.toLocaleDateString("ru-RU") + ` ${hh}:${mm}`;
}

export function EventFeedCompact() {
  const [items, setItems] = useState<Photo[] | null>(null);

  useEffect(() => {
    api.listPhotos().then((all) => setItems(all.slice(0, 4))).catch(() => setItems([]));
  }, []);

  return (
    <section className="border-2 border-primary/40 bg-card">
      <div className="flex items-center justify-between border-b border-primary/40 bg-secondary px-3 py-2">
        <h2 className="text-sm uppercase tracking-widest text-primary">▦ Лента событий</h2>
        <Link to="/" className="text-[10px] uppercase tracking-wider text-secondary-foreground/80 hover:text-primary">
          все ▶
        </Link>
      </div>

      <div className="divide-y divide-primary/20">
        {items === null && (
          <div className="p-3 text-xs text-muted-foreground">Загрузка...</div>
        )}
        {items?.length === 0 && (
          <div className="p-3 text-xs text-muted-foreground">Пока нет событий.</div>
        )}
        {items?.map((p) => (
          <div key={p.id} className="flex gap-3 p-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: colorFor(p.uploaded_by || p.agent || "?") }}
            >
              {initial(p.uploaded_by || p.agent || "?")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider">
                <span className="truncate text-primary">{p.uploaded_by || p.agent || "—"}</span>
                <span className="shrink-0 text-muted-foreground">{timeAgo(p.created_at)}</span>
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                ◉ {p.city}
                {p.category === "food" && <span className="ml-2 text-primary">· ЕДА</span>}
              </div>
              {p.caption && (
                <p className="mt-1 line-clamp-2 text-xs">{p.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
