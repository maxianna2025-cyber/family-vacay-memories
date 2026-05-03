import { createFileRoute } from "@tanstack/react-router";
import { PhotoFeed } from "@/components/PhotoFeed";
import { useUserName } from "@/hooks/useUserName";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "База — Спецотряд: Саянская Вершина" },
      {
        name: "description",
        content: "Лента улик: фото из городов отпуска с подписями и комментариями.",
      },
    ],
  }),
});

function Index() {
  const { name } = useUserName();
  const needName = () => {
    if (!name) {
      toast.error("Сначала введите свой позывной (кнопка вверху справа)");
      return true;
    }
    return false;
  };
  return <PhotoFeed needName={needName} />;
}
