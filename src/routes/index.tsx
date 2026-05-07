import { createFileRoute } from "@tanstack/react-router";
import { HeroHeader } from "@/components/HeroHeader";
import { RouteMap } from "@/components/RouteMap";
import { CityPreviews } from "@/components/CityPreviews";
import { EventFeedCompact } from "@/components/EventFeedCompact";
import { MissionTasksCard } from "@/components/MissionTasksCard";
import { MissionStats } from "@/components/MissionStats";
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
        content: "Командный пункт операции: карта, города, лента и задания.",
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

  return (
    <div className="space-y-4">
      <HeroHeader />

      <RouteMap />

      <CityPreviews />

      <div className="grid gap-4 lg:grid-cols-2">
        <EventFeedCompact />
        <MissionTasksCard />
      </div>

      <MissionStats />

      <PhotoFeed needName={needName} category="field" />
    </div>
  );
}
