import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { api, type Task } from "@/lib/api";
import { toast } from "sonner";

const SECTOR_NAMES: Record<string, string> = {
  beijing: "Пекин",
  hongkong: "Гонконг",
  danang: "Дананг",
  macau: "Макао",
};

export function MissionTasksCard() {
  const [tasks, setTasks] = useState<Task[] | null>(null);

  useEffect(() => {
    api.listTasks().then((all) => setTasks(all.slice(0, 4))).catch(() => setTasks([]));
  }, []);

  return (
    <section className="border-2 border-primary/40 bg-card">
      <div className="flex items-center justify-between border-b border-primary/40 bg-secondary px-3 py-2">
        <h2 className="text-sm uppercase tracking-widest text-primary">((◉)) Задания от штаба</h2>
        <Link to="/tasks" className="text-[10px] uppercase tracking-wider text-secondary-foreground/80 hover:text-primary">
          все ▶
        </Link>
      </div>
      <div className="divide-y divide-primary/20">
        {tasks === null && <div className="p-3 text-xs text-muted-foreground">Загрузка...</div>}
        {tasks?.length === 0 && (
          <div className="p-3 text-xs text-muted-foreground">Пока заданий нет.</div>
        )}
        {tasks?.map((t) => {
          const sector = t.sector_slug ? SECTOR_NAMES[t.sector_slug] || t.sector_slug : "Все";
          return (
            <div key={t.id} className="space-y-2 p-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
                <span className="text-primary">{t.user_name}</span>
                <span className="border border-primary/40 px-1.5 py-0.5 text-[10px] text-primary">
                  ⌂ {sector}
                </span>
              </div>
              <p className="text-xs">{t.task_text}</p>
              <button
                onClick={() => toast.success("Принято, агент")}
                className="border border-primary/60 px-2 py-1 text-[10px] uppercase tracking-wider text-primary hover:bg-primary/20"
              >
                ▶ Принять
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
