import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { api, type Task } from "@/lib/api";
import { useUserName } from "@/hooks/useUserName";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/tasks")({
  component: TasksPage,
  head: () => ({
    meta: [
      { title: "Спецзадания — Саянская Вершина" },
      {
        name: "description",
        content: "Дополнительные задания для отряда: отправка и просмотр.",
      },
    ],
  }),
});

function TasksPage() {
  const { name } = useUserName();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = () =>
    api.listTasks().then(setTasks).catch((e) => toast.error(e.message));

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    if (!name) return toast.error("Сначала введите свой позывной");
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.addTask({ user_name: name, task_text: text.trim().slice(0, 500) });
      setText("");
      toast.success("Задание передано отряду");
      await load();
    } catch (e) {
      toast.error("Ошибка: " + (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="border border-primary/40 bg-card p-4">
        <h2 className="mb-3 text-lg uppercase">✦ Новое спецзадание</h2>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder="Например: найти 3 разных шишки в лесу и сфотографировать"
          className="min-h-[120px]"
        />
        <Button className="mt-3" onClick={send} disabled={sending || !text.trim()}>
          {sending ? "Передача..." : "▲ Передать отряду"}
        </Button>
      </section>

      <section>
        <h2 className="mb-3 text-lg uppercase">▦ Активные задания</h2>
        {tasks === null ? (
          <p className="text-muted-foreground">Загрузка...</p>
        ) : tasks.length === 0 ? (
          <p className="text-muted-foreground">Пока заданий нет.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div
                key={t.id}
                className="border border-primary/40 bg-card p-3"
              >
                <div className="flex items-center justify-between text-xs uppercase text-muted-foreground">
                  <span className="text-primary">{t.user_name}</span>
                  <span>{new Date(t.created_at).toLocaleString("ru-RU")}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{t.task_text}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
