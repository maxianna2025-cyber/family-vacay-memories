import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  adminLogin,
  adminGetSectors,
  adminUpdateSector,
  adminUpdateAgent,
  adminUpdateSetting,
  adminDeletePhoto,
  adminDeleteTask,
  adminAddTask,
} from "@/server/admin.functions";
import { api, type Photo, type Task } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Штаб — Админка" }] }),
});

const PW_KEY = "admin:pw";

function AdminPage() {
  const [pw, setPw] = useState<string | null>(
    typeof window !== "undefined" ? sessionStorage.getItem(PW_KEY) : null,
  );
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true);
    try {
      await adminLogin({ data: { password: input } });
      sessionStorage.setItem(PW_KEY, input);
      setPw(input);
      toast.success("Доступ разрешён");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!pw) {
    return (
      <div className="mx-auto max-w-sm space-y-3 border-2 border-primary/60 bg-card p-6">
        <h2 className="text-xl uppercase text-primary">⛨ Штаб</h2>
        <p className="text-xs text-muted-foreground">Мастер-пароль</p>
        <Input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
        />
        <Button
          className="w-full"
          onClick={() => {
            if (!input.trim()) return toast.error("Введите мастер-пароль");
            login();
          }}
          disabled={busy}
        >
          {busy ? "Проверка..." : "Войти"}
        </Button>
      </div>
    );
  }

  return <AdminPanel pw={pw} onLogout={() => { sessionStorage.removeItem(PW_KEY); setPw(null); }} />;
}

interface Sector { id: string; slug: string; title: string; briefing: string; mission: string; password: string; order_index: number }
interface Agent { id: string; slug: string; display_name: string }

function AdminPanel({ pw, onLogout }: { pw: string; onLogout: () => void }) {
  const [settings, setSettings] = useState<{ app_title: string; app_subtitle: string; route_progress: string }>({ app_title: "", app_subtitle: "", route_progress: "0" });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");

  const reload = async () => {
    const [s, a, ph, t] = await Promise.all([
      supabase.from("app_settings").select("*"),
      supabase.from("agents").select("*").order("order_index"),
      api.listPhotos(),
      api.listTasks(),
    ]);
    if (s.data) {
      const map: Record<string, string> = {};
      for (const r of s.data) map[r.key] = r.value;
      setSettings({ app_title: map.app_title ?? "", app_subtitle: map.app_subtitle ?? "", route_progress: map.route_progress ?? "0" });
    }
    setAgents((a.data ?? []) as Agent[]);
    setPhotos(ph);
    setTasks(t);
    try {
      const sec = await adminGetSectors({ data: { password: pw } });
      setSectors(sec as Sector[]);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  useEffect(() => { reload(); }, []);

  const saveSetting = async (key: string, value: string) => {
    try {
      await adminUpdateSetting({ data: { password: pw, key, value } });
      toast.success("Сохранено");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl uppercase text-primary">⛨ Штаб операции</h2>
        <Button variant="outline" size="sm" onClick={onLogout}>Выйти</Button>
      </div>

      {/* Settings */}
      <section className="border-2 border-primary/40 bg-card p-4 space-y-3">
        <h3 className="text-lg uppercase">Настройки</h3>
        <label className="block text-xs uppercase text-muted-foreground">Название приложения</label>
        <Input value={settings.app_title} onChange={(e) => setSettings({ ...settings, app_title: e.target.value })} />
        <Button size="sm" onClick={() => saveSetting("app_title", settings.app_title)}>Сохранить</Button>
        <label className="block text-xs uppercase text-muted-foreground mt-3">Подзаголовок</label>
        <Input value={settings.app_subtitle} onChange={(e) => setSettings({ ...settings, app_subtitle: e.target.value })} />
        <Button size="sm" onClick={() => saveSetting("app_subtitle", settings.app_subtitle)}>Сохранить</Button>
      </section>

      {/* Route progress */}
      <section className="border-2 border-primary/40 bg-card p-4 space-y-3">
        <h3 className="text-lg uppercase">Прогресс маршрута</h3>
        <p className="text-xs text-muted-foreground">
          Точки: 1.Красноярск → 2.Пекин → 3.Гонконг → 4.Дананг → 5.Макао → 6.Пекин
        </p>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            disabled={parseInt(settings.route_progress, 10) <= 0}
            onClick={async () => {
              const next = String(Math.max(0, parseInt(settings.route_progress, 10) - 1));
              setSettings({ ...settings, route_progress: next });
              await saveSetting("route_progress", next);
            }}
          >
            ◀ Назад
          </Button>
          <div className="text-2xl text-primary tabular-nums">
            {settings.route_progress}/6
          </div>
          <Button
            size="sm"
            disabled={parseInt(settings.route_progress, 10) >= 6}
            onClick={async () => {
              const next = String(Math.min(6, parseInt(settings.route_progress, 10) + 1));
              setSettings({ ...settings, route_progress: next });
              await saveSetting("route_progress", next);
            }}
          >
            Продвинуть ▶
          </Button>
        </div>
      </section>

      {/* Agents */}
      <section className="border-2 border-primary/40 bg-card p-4 space-y-3">
        <h3 className="text-lg uppercase">Агенты</h3>
        {agents.map((a) => (
          <div key={a.id} className="flex gap-2">
            <span className="self-center text-xs text-muted-foreground w-20">{a.slug}</span>
            <Input
              value={a.display_name}
              onChange={(e) => setAgents(agents.map(x => x.id === a.id ? { ...x, display_name: e.target.value } : x))}
            />
            <Button size="sm" onClick={async () => {
              try { await adminUpdateAgent({ data: { password: pw, id: a.id, display_name: a.display_name } }); toast.success("Сохранено"); }
              catch (e) { toast.error((e as Error).message); }
            }}>OK</Button>
          </div>
        ))}
      </section>

      {/* Sectors */}
      <section className="border-2 border-primary/40 bg-card p-4 space-y-4">
        <h3 className="text-lg uppercase">Секторы</h3>
        {sectors.map((s, i) => (
          <div key={s.id} className="border border-primary/30 p-3 space-y-2">
            <div className="text-xs uppercase text-muted-foreground">{s.slug}</div>
            <Input
              value={s.title}
              placeholder="Название"
              onChange={(e) => setSectors(sectors.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
            />
            <Textarea
              value={s.briefing}
              placeholder="Брифинг"
              onChange={(e) => setSectors(sectors.map((x, j) => j === i ? { ...x, briefing: e.target.value } : x))}
            />
            <Textarea
              value={s.mission}
              placeholder="Задание"
              onChange={(e) => setSectors(sectors.map((x, j) => j === i ? { ...x, mission: e.target.value } : x))}
            />
            <Input
              value={s.password}
              placeholder="Пароль сектора"
              onChange={(e) => setSectors(sectors.map((x, j) => j === i ? { ...x, password: e.target.value } : x))}
            />
            <Button size="sm" onClick={async () => {
              try {
                await adminUpdateSector({ data: { password: pw, id: s.id, title: s.title, briefing: s.briefing, mission: s.mission, sectorPassword: s.password } });
                toast.success("Сектор обновлён");
              } catch (e) { toast.error((e as Error).message); }
            }}>Сохранить сектор</Button>
          </div>
        ))}
      </section>

      {/* Tasks */}
      <section className="border-2 border-primary/40 bg-card p-4 space-y-3">
        <h3 className="text-lg uppercase">Дополнительные задания</h3>
        <div className="flex gap-2">
          <Input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Новое задание для детей" />
          <Button onClick={async () => {
            if (!newTask.trim()) return;
            try { await adminAddTask({ data: { password: pw, task_text: newTask.trim() } }); setNewTask(""); reload(); }
            catch (e) { toast.error((e as Error).message); }
          }}>Добавить</Button>
        </div>
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between border border-primary/20 p-2 text-sm">
            <span><span className="text-primary">{t.user_name}:</span> {t.task_text}</span>
            <Button size="sm" variant="destructive" onClick={async () => {
              try { await adminDeleteTask({ data: { password: pw, id: t.id } }); reload(); }
              catch (e) { toast.error((e as Error).message); }
            }}>×</Button>
          </div>
        ))}
      </section>

      {/* Photos moderation */}
      <section className="border-2 border-primary/40 bg-card p-4 space-y-3">
        <h3 className="text-lg uppercase">Лента: модерация</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <div key={p.id} className="border border-primary/30 p-2 space-y-1">
              {p.media_type === "video" ? (
                <video src={api.getPhotoUrl(p.file_path)} controls className="aspect-video w-full bg-black object-contain" />
              ) : (
                <img src={api.getPhotoUrl(p.file_path)} alt={p.caption} className="aspect-video w-full object-cover" />
              )}
              <div className="text-xs text-muted-foreground">
                {p.media_type === "video" ? "🎬 " : ""}{p.city} · {p.agent} · {p.category === "food" ? "еда" : "поле"}
              </div>
              {p.caption && <div className="text-xs">{p.caption}</div>}
              <Button size="sm" variant="destructive" className="w-full" onClick={async () => {
                if (!confirm("Удалить запись?")) return;
                try { await adminDeletePhoto({ data: { password: pw, id: p.id } }); reload(); toast.success("Удалено"); }
                catch (e) { toast.error((e as Error).message); }
              }}>Удалить</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
