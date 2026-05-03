import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAppSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({
    app_title: "СПЕЦОТРЯД: САЯНСКАЯ ВЕРШИНА",
    app_subtitle: "МЧС России · Семейная операция",
  });

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("*")
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          for (const r of data) map[r.key] = r.value;
          setSettings((s) => ({ ...s, ...map }));
        }
      });
  }, []);

  return settings;
}
