import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { UserNameBadge } from "@/components/UserNameBadge";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl">404</h1>
        <p className="mt-4 text-muted-foreground">Страница не найдена</p>
        <Link
          to="/"
          className="mt-6 inline-block bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover"
        >
          На базу
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Спецотряд: Саянская Вершина" },
      {
        name: "description",
        content:
          "Семейный журнал отпуска: фото, комментарии и спецзадания для отряда.",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-primary/40 bg-secondary text-secondary-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2">
          <Link to="/" className="text-[11px] uppercase tracking-[0.3em] text-primary">
            ⛨ Командный пункт
          </Link>
          <UserNameBadge />
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-2 px-3 pb-2 text-[11px] uppercase">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="border border-primary/60 px-2 py-1 hover:bg-primary/20"
          >
            База
          </Link>
          <Link
            to="/food"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="border border-primary/60 px-2 py-1 hover:bg-primary/20"
          >
            Кухня
          </Link>
          <Link
            to="/agent"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="border border-primary/60 px-2 py-1 hover:bg-primary/20"
          >
            Агент
          </Link>
          <Link
            to="/tasks"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="border border-primary/60 px-2 py-1 hover:bg-primary/20"
          >
            Задания
          </Link>
          <Link
            to="/admin"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="ml-auto border border-primary/60 px-2 py-1 hover:bg-primary/20"
          >
            Штаб
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
