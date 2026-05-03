import { createFileRoute } from "@tanstack/react-router";
import { PhotoFeed } from "@/components/PhotoFeed";
import { useUserName } from "@/hooks/useUserName";
import { toast } from "sonner";

export const Route = createFileRoute("/food")({
  component: FoodPage,
  head: () => ({
    meta: [
      { title: "Кухня — Спецотряд: Саянская Вершина" },
      { name: "description", content: "Фотоотчёты о еде в путешествии." },
    ],
  }),
});

function FoodPage() {
  const { name } = useUserName();
  const needName = () => {
    if (!name) {
      toast.error("Сначала введите свой позывной (кнопка вверху справа)");
      return true;
    }
    return false;
  };
  return (
    <div className="space-y-4">
      <div className="border-l-4 border-primary bg-card px-4 py-2">
        <h2 className="text-xl uppercase text-primary">🍜 Кухня операции</h2>
        <p className="text-xs text-muted-foreground">Фотоотчёты о еде из всех секторов</p>
      </div>
      <PhotoFeed needName={needName} category="food" />
    </div>
  );
}
