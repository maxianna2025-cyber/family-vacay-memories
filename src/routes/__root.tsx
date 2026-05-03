import {
  Outlet,
  Link,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { UserNameBadge } from "@/components/UserNameBadge";
import { useAppSettings } from "@/hooks/useAppSettings";
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
  const settings = useAppSettings();
  return (
    <div className="min-h-screen">
      <header className="border-b-4 border-primary bg-secondary text-secondary-foreground">
        <div className="h-1 bg-primary" />
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="block">
            <div className="text-[10px] uppercase tracking-[0.3em] text-primary">МЧС России</div>
            <h1 className="text-lg uppercase tracking-widest sm:text-xl">
              {settings.app_title}
            </h1>
            <div className="text-xs text-secondary-foreground/70">{settings.app_subtitle}</div>
          </Link>
          <UserNameBadge />
        </div>
        <nav className="mx-auto flex max-w-5xl flex-wrap gap-2 px-4 pb-3 text-xs uppercase">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="border border-primary/60 px-3 py-1 hover:bg-primary/20"
          >
            База / Лента
          </Link>
          <Link
            to="/agent"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="border border-primary/60 px-3 py-1 hover:bg-primary/20"
          >
            Кабинет агента
          </Link>
          <Link
            to="/tasks"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="border border-primary/60 px-3 py-1 hover:bg-primary/20"
          >
            Доп. миссии
          </Link>
          <Link
            to="/admin"
            activeProps={{ className: "bg-primary text-primary-foreground" }}
            className="ml-auto border border-primary/60 px-3 py-1 hover:bg-primary/20"
          >
            Штаб
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
