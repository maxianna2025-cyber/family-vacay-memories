import { useEffect, useState } from "react";

const KEY = "spectre_user_name";

export function useUserName() {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setName(localStorage.getItem(KEY) ?? "");
  }, []);

  const update = (n: string) => {
    const trimmed = n.trim().slice(0, 40);
    setName(trimmed);
    if (typeof window !== "undefined") {
      if (trimmed) localStorage.setItem(KEY, trimmed);
      else localStorage.removeItem(KEY);
    }
  };

  return { name, setName: update };
}
