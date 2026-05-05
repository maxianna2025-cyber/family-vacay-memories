import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import beijingImg from "@/assets/cities/beijing.jpg";
import hongkongImg from "@/assets/cities/hongkong.jpg";
import danangImg from "@/assets/cities/danang.jpg";
import macauImg from "@/assets/cities/macau.jpg";

const CITIES = [
  { slug: "beijing", name: "Пекин", img: beijingImg },
  { slug: "hongkong", name: "Гонконг", img: hongkongImg },
  { slug: "danang", name: "Дананг", img: danangImg },
  { slug: "macau", name: "Макао", img: macauImg },
];

const AGENT_KEY = "spec:selectedAgent";

export function CityPreviews() {
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const agent = typeof window !== "undefined" ? localStorage.getItem(AGENT_KEY) : null;
    if (!agent) return;
    const map: Record<string, boolean> = {};
    for (const c of CITIES) {
      map[c.slug] = localStorage.getItem(`unlocked:${agent}:${c.slug}`) === "1";
    }
    setUnlocked(map);
  }, []);

  return (
    <section className="border-2 border-primary/40 bg-card">
      <div className="border-b border-primary/40 bg-secondary px-3 py-2">
        <h2 className="text-sm uppercase tracking-widest text-primary">⌂ Города миссии</h2>
        <p className="text-[10px] text-secondary-foreground/70 uppercase tracking-wider">
          Выбери город и выполни задание
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-2 sm:grid-cols-4 sm:gap-3 sm:p-3">
        {CITIES.map((c) => {
          const isUnlocked = unlocked[c.slug];
          return (
            <Link
              key={c.slug}
              to="/agent"
              search={{ sector: c.slug } as any}
              className="group block border border-primary/30 bg-background hover:border-primary"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                <img
                  src={c.img}
                  alt={c.name}
                  loading="lazy"
                  width={768}
                  height={576}
                  className="h-full w-full object-cover transition group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                <div className="absolute right-1 top-1 border border-primary/60 bg-background/80 px-1 py-0.5 text-[10px] text-primary">
                  {isUnlocked ? "✓" : "🔒"}
                </div>
              </div>
              <div className="border-t border-primary/30 px-2 py-1.5 text-center">
                <div className="text-xs uppercase tracking-widest text-primary">{c.name}</div>
                <div className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">
                  ▶ Вход
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
