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
  adminUpdateTask,
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
  const [settings, setSettings] = useState<{ app_title: string; app_subtitle: string; route_progress: string; route_dates: string }>({ app_title: "", app_subtitle: "", route_progress: "0", route_dates: '["05.07","07.07","10.07","13.07","17.07","20.07"]' });
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  // task creation handled inside TasksByCity
  const parsedDates: string[] = (() => { try { const a = JSON.parse(settings.route_dates); return Array.isArray(a) && a.length === 6 ? a.map(String) : ["","","","","",""]; } catch { return ["","","","","",""]; } })();

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
      setSettings({ app_title: map.app_title ?? "", app_subtitle: map.app_subtitle ?? "", route_progress: map.route_progress ?? "0", route_dates: map.route_dates ?? '["05.07","07.07","10.07","13.07","17.07","20.07"]' });
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

      {/* Route dates */}
      <section className="border-2 border-primary/40 bg-card p-4 space-y-2">
        <h3 className="text-lg uppercase">Даты маршрута</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {["Красноярск","Пекин","Гонконг","Дананг","Макао","Пекин (возврат)"].map((label, i) => (
            <label key={i} className="block text-xs">
              <span className="text-muted-foreground">{i+1}. {label}</span>
              <Input value={parsedDates[i]} placeholder="ДД.ММ" onChange={(e) => {
                const next = [...parsedDates]; next[i] = e.target.value;
                setSettings({ ...settings, route_dates: JSON.stringify(next) });
              }} />
            </label>
          ))}
        </div>
        <Button size="sm" onClick={() => saveSetting("route_dates", settings.route_dates)}>Сохранить даты</Button>
      </section>

      {/* Tasks grouped by city */}
      <TasksByCity pw={pw} tasks={tasks} reload={reload} />

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

const CITY_OPTIONS: { slug: string; label: string }[] = [
  { slug: "", label: "Все города" },
  { slug: "beijing", label: "Пекин" },
  { slug: "hongkong", label: "Гонконг" },
  { slug: "danang", label: "Дананг" },
  { slug: "macau", label: "Макао" },
];

function TasksByCity({ pw, tasks, reload }: { pw: string; tasks: Task[]; reload: () => Promise<void> }) {
  const groups = CITY_OPTIONS.map((c) => ({
    ...c,
    items: tasks.filter((t) => (t.sector_slug ?? "") === c.slug),
  }));

  return (
    <section className="space-y-4">
      <h3 className="text-lg uppercase">Задания по городам</h3>
      {groups.map((g) => (
        <CityTaskGroup key={g.slug || "all"} pw={pw} group={g} reload={reload} />
      ))}
    </section>
  );
}

function CityTaskGroup({
  pw,
  group,
  reload,
}: {
  pw: string;
  group: { slug: string; label: string; items: Task[] };
  reload: () => Promise<void>;
}) {
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  const add = async () => {
    if (!newText.trim()) return toast.error("Введите текст задания");
    setAdding(true);
    try {
      await adminAddTask({
        data: { password: pw, task_text: newText.trim(), sector_slug: group.slug || null },
      });
      setNewText("");
      await reload();
      toast.success("Задание добавлено");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="border-2 border-primary/40 bg-card p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm uppercase text-primary">⌂ {group.label}</div>
        <div className="text-[10px] uppercase text-muted-foreground">{group.items.length} зад.</div>
      </div>

      {group.items.length === 0 && (
        <div className="text-xs text-muted-foreground">Заданий ещё нет.</div>
      )}

      <div className="space-y-2">
        {group.items.map((t) => (
          <TaskRow key={t.id} pw={pw} task={t} reload={reload} />
        ))}
      </div>

      <div className="border-t border-primary/20 pt-2 space-y-2">
        <Textarea
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder={`Новое задание для: ${group.label}`}
          className="min-h-[60px]"
        />
        <Button size="sm" onClick={add} disabled={adding}>
          {adding ? "Добавление..." : "+ Добавить задание"}
        </Button>
      </div>
    </div>
  );
}

function TaskRow({ pw, task, reload }: { pw: string; task: Task; reload: () => Promise<void> }) {
  const [text, setText] = useState(task.task_text);
  const [sector, setSector] = useState<string>(task.sector_slug ?? "");
  const [busy, setBusy] = useState(false);
  const dirty = text !== task.task_text || (sector || null) !== (task.sector_slug ?? null);

  const save = async () => {
    if (!text.trim()) return toast.error("Текст не может быть пустым");
    setBusy(true);
    try {
      await adminUpdateTask({
        data: { password: pw, id: task.id, task_text: text.trim(), sector_slug: sector || null },
      });
      await reload();
      toast.success("Сохранено");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!confirm("Удалить задание?")) return;
    try {
      await adminDeleteTask({ data: { password: pw, id: task.id } });
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="border border-primary/20 p-2 space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground">
        <span>{task.user_name}</span>
        <span>{new Date(task.created_at).toLocaleDateString("ru-RU")}</span>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[60px] text-sm"
      />
      <div className="flex items-center gap-2">
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="flex-1 border border-primary/40 bg-background px-2 py-1 text-xs"
        >
          {CITY_OPTIONS.map((c) => (
            <option key={c.slug || "all"} value={c.slug}>{c.label}</option>
          ))}
        </select>
        <Button size="sm" onClick={save} disabled={busy || !dirty}>
          {busy ? "..." : dirty ? "Сохранить" : "OK"}
        </Button>
        <Button size="sm" variant="destructive" onClick={del}>×</Button>
      </div>
    </div>
  );
}
