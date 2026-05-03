import { useState } from "react";
import { useUserName } from "@/hooks/useUserName";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export function UserNameBadge() {
  const { name, setName } = useUserName();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const onOpen = (v: boolean) => {
    setOpen(v);
    if (v) setDraft(name);
  };

  const save = () => {
    if (!draft.trim()) return;
    setName(draft);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger asChild>
        <button className="border border-primary/60 bg-background px-3 py-1 text-sm hover:bg-primary/20">
          {name ? (
            <>
              <span className="text-muted-foreground">агент:</span>{" "}
              <span className="text-primary">{name}</span>{" "}
              <span className="text-muted-foreground">[сменить]</span>
            </>
          ) : (
            <span className="text-primary">▶ Назвать позывной</span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="border-primary/40 bg-card">
        <DialogHeader>
          <DialogTitle>Ваш позывной</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={draft}
          maxLength={40}
          placeholder="Например: Бабушка, Папа, Лиса"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <DialogFooter>
          <Button onClick={save} disabled={!draft.trim()}>
            Подтвердить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
