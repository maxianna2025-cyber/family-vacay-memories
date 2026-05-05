import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { unlockSector } from "@/server/admin.functions";
import { api } from "@/lib/api";
import { useUserName } from "@/hooks/useUserName";

export const Route = createFileRoute("/agent")({
  component: AgentPage,
  head: () => ({
    meta: [{ title: "Кабинет агента — Спецотряд" }],
  }),
});

interface Agent { id: string; slug: string; display_name: string; order_index: number }
interface Sector { id: string; slug: string; title: string; briefing: string; mission: string; order_index: number }

const AGENT_KEY = "spec:selectedAgent";

function AgentPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [agent, setAgent] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(AGENT_KEY) : null,
  );

  useEffect(() => {
    supabase.from("agents").select("*").order("order_index").then(({ data }) => setAgents((data ?? []) as Agent[]));
    supabase.from("sectors_public").select("*").order("order_index").then(({ data }) => setSectors((data ?? []) as Sector[]));
  }, []);

  const choose = (slug: string) => {
    localStorage.setItem(AGENT_KEY, slug);
    setAgent(slug);
  };
  const reset = () => {
    localStorage.removeItem(AGENT_KEY);
    setAgent(null);
  };

  if (!agent) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl uppercase">Выбор агента</h2>
        <p className="text-sm text-muted-foreground">Кто выходит на связь?</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => choose(a.slug)}
              className="border-2 border-primary/60 bg-card p-6 text-left uppercase hover:bg-primary/20"
            >
              <div className="text-xs text-muted-foreground">Профиль</div>
              <div className="text-lg text-primary">{a.display_name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const current = agents.find((a) => a.slug === agent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase text-muted-foreground">Активный агент</div>
          <div className="text-xl uppercase text-primary">{current?.display_name ?? agent}</div>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>Сменить</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {sectors.map((s) => (
          <SectorCard key={s.id} sector={s} agentSlug={agent} />
        ))}
      </div>
    </div>
  );
}

function SectorCard({ sector, agentSlug }: { sector: Sector; agentSlug: string }) {
  const lockKey = `unlocked:${agentSlug}:${sector.slug}`;
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const { name } = useUserName();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(lockKey) === "1");
  }, [lockKey]);

  const tryUnlock = async () => {
    if (!pw.trim()) return;
    setBusy(true);
    try {
      await unlockSector({ data: { slug: sector.slug, password: pw.trim() } });
      localStorage.setItem(lockKey, "1");
      setUnlocked(true);
      toast.success("Сектор разблокирован");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const uploadProof = async () => {
    if (!file) return toast.error("Выберите файл");
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) return toast.error("Только фото или видео");
    const maxMb = isVideo ? 50 : 10;
    if (file.size > maxMb * 1024 * 1024) return toast.error(`Файл больше ${maxMb} МБ`);
    setUploading(true);
    try {
      await api.uploadPhoto({
        file,
        city: sector.title,
        caption: `Доказательство задания: ${sector.mission}`.slice(0, 200),
        agent: agentSlug,
        uploaded_by: name || agentSlug,
      });
      setFile(null);
      toast.success("Доказательство загружено в общую ленту");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <article className="border-2 border-primary/40 bg-card p-4">
      <h3 className="text-lg uppercase text-primary">{sector.title}</h3>
      {!unlocked ? (
        <div className="mt-3 space-y-2">
          <div className="text-3xl text-center text-muted-foreground">🔒</div>
          <p className="text-xs text-muted-foreground text-center">Введите пароль сектора</p>
          <Input
            type="password"
            placeholder="••••"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          />
          <Button
            className="w-full"
            onClick={() => {
              if (!pw.trim()) return toast.error("Введите пароль сектора");
              tryUnlock();
            }}
            disabled={busy}
          >
            {busy ? "Проверка..." : "Открыть"}
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div>
            <div className="text-xs uppercase text-muted-foreground">Брифинг</div>
            <p className="text-sm">{sector.briefing}</p>
          </div>
          <div>
            <div className="text-xs uppercase text-muted-foreground">Задание</div>
            <p className="text-sm">{sector.mission}</p>
          </div>
          <div className="border-t border-primary/30 pt-2">
            <div className="text-xs uppercase text-primary mb-1">Фото / Видео-доказательство</div>
            <Input
              type="file"
              accept="image/*,video/mp4,video/quicktime,video/webm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button className="mt-2 w-full" size="sm" onClick={uploadProof} disabled={uploading}>
              {uploading ? "Отправка..." : "▲ Передать доказательство"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
