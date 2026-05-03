import { useEffect, useState } from "react";
import { useUserName } from "@/hooks/useUserName";
import { api, type Photo, type Comment, type PhotoCategory } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  needName: () => boolean;
  category?: PhotoCategory;
}

const LABELS = {
  field: {
    title: "▦ Лента операции",
    upload: "⊕ Загрузить улику",
    cityPlaceholder: "Город (Красноярск, Дивногорск...)",
    captionPlaceholder: "Подпись",
    button: "▲ Передать в штаб",
    empty: "Пока пусто. Будь первым агентом, кто пришлёт улику.",
  },
  food: {
    title: "▦ Кухня операции",
    upload: "⊕ Загрузить блюдо",
    cityPlaceholder: "Где ел (Пекин, ресторан...)",
    captionPlaceholder: "Что это и как (вкусно? острое?)",
    button: "▲ Передать рапорт о еде",
    empty: "Никто ещё не ел. Покажи первое блюдо!",
  },
} as const;

export function PhotoFeed({ needName, category = "field" }: Props) {
  const { name } = useUserName();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [busy, setBusy] = useState(false);
  const L = LABELS[category];

  // upload form
  const [file, setFile] = useState<File | null>(null);
  const [city, setCity] = useState("");
  const [caption, setCaption] = useState("");
  const [agent, setAgent] = useState("Агент 1");

  const refresh = () =>
    api
      .listPhotos(category)
      .then(setPhotos)
      .catch((e) => toast.error("Не удалось загрузить фото: " + e.message));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const upload = async () => {
    if (needName()) return;
    if (!file) return toast.error("Выберите файл");
    if (!city.trim()) return toast.error("Укажите место");
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) return toast.error("Только фото или видео");
    const maxMb = isVideo ? 50 : 10;
    if (file.size > maxMb * 1024 * 1024) return toast.error(`Файл больше ${maxMb} МБ`);
    setBusy(true);
    try {
      await api.uploadPhoto({
        file,
        city: city.trim().slice(0, 80),
        caption: caption.trim().slice(0, 200),
        agent: agent.trim().slice(0, 40),
        uploaded_by: name,
        category,
      });
      setFile(null);
      setCity("");
      setCaption("");
      toast.success("Загружено");
      await refresh();
    } catch (e) {
      toast.error("Ошибка загрузки: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="border border-primary/40 bg-card p-4">
        <h2 className="mb-3 text-lg uppercase">{L.upload}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            type="file"
            accept="image/*,video/mp4,video/quicktime,video/webm"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Input
            placeholder={L.cityPlaceholder}
            value={city}
            maxLength={80}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            placeholder="Кодовое имя агента"
            value={agent}
            maxLength={40}
            onChange={(e) => setAgent(e.target.value)}
          />
          <Input
            placeholder={L.captionPlaceholder}
            value={caption}
            maxLength={200}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        <Button className="mt-3" onClick={upload} disabled={busy}>
          {busy ? "Загрузка..." : L.button}
        </Button>
      </section>

      <section>
        <h2 className="mb-3 text-lg uppercase">{L.title}</h2>
        {photos === null ? (
          <p className="text-muted-foreground">Получение данных со спутника...</p>
        ) : photos.length === 0 ? (
          <p className="text-muted-foreground">{L.empty}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {photos.map((p) => (
              <PhotoCard key={p.id} photo={p} needName={needName} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function PhotoCard({ photo, needName }: { photo: Photo; needName: () => boolean }) {
  const { name } = useUserName();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = () =>
    api.listComments(photo.id).then(setComments).catch(() => undefined);

  useEffect(() => {
    load();
  }, [photo.id]);

  const send = async () => {
    if (needName()) return;
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.addComment({
        photo_id: photo.id,
        user_name: name,
        comment_text: text.trim().slice(0, 500),
      });
      setText("");
      await load();
    } catch (e) {
      toast.error("Ошибка: " + (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <article className="flex flex-col border border-primary/40 bg-card">
      {photo.media_type === "video" ? (
        <video
          src={api.getPhotoUrl(photo.file_path)}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black object-contain"
        />
      ) : (
        <img
          src={api.getPhotoUrl(photo.file_path)}
          alt={photo.caption || photo.city}
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
      )}
      <div className="flex-1 space-y-2 p-3">
        <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
          <span>◉ {photo.city}</span>
          <span>{new Date(photo.created_at).toLocaleString("ru-RU")}</span>
        </div>
        {photo.caption && <p className="text-sm">{photo.caption}</p>}
        <p className="text-xs text-muted-foreground">
          агент: <span className="text-primary">{photo.agent || "—"}</span>
          {photo.uploaded_by && <> · загрузил: {photo.uploaded_by}</>}
        </p>

        <div className="space-y-2 border-t border-primary/30 pt-2">
          <h3 className="text-xs uppercase text-primary">Радиоперехват</h3>
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground">Тишина в эфире.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="text-xs">
              <span className="text-primary">{c.user_name}:</span> {c.comment_text}
            </div>
          ))}
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Передать сообщение..."
            className="min-h-[60px]"
          />
          <Button size="sm" onClick={send} disabled={sending || !text.trim()}>
            ▶ Отправить
          </Button>
        </div>
      </div>
    </article>
  );
}
