import { useEffect, useRef } from "react";

const YANDEX_API_KEY = "a980df24-80a0-4eb9-aec1-ac9fd151d7ab";

const ROUTE: Array<{ name: string; coords: [number, number] }> = [
  { name: "Красноярск", coords: [56.0153, 92.8932] },
  { name: "Пекин", coords: [39.9042, 116.4074] },
  { name: "Гонконг", coords: [22.3193, 114.1694] },
  { name: "Дананг", coords: [16.0544, 108.2022] },
  { name: "Макао", coords: [22.1987, 113.5439] },
  { name: "Пекин (возвращение)", coords: [39.9042, 116.4074] },
];

declare global {
  interface Window {
    ymaps?: any;
    __ymapsLoading?: Promise<any>;
  }
}

function loadYmaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.ymaps) return Promise.resolve(window.ymaps);
  if (window.__ymapsLoading) return window.__ymapsLoading;

  window.__ymapsLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_API_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () => window.ymaps.ready(() => resolve(window.ymaps));
    script.onerror = () => reject(new Error("не удалось загрузить"));
    document.head.appendChild(script);
  });
  return window.__ymapsLoading;
}

export function RouteMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: any;
    let cancelled = false;

    loadYmaps()
      .then((ymaps) => {
        if (cancelled || !ref.current) return;
        map = new ymaps.Map(ref.current, {
          center: [35, 105],
          zoom: 3,
          controls: ["zoomControl"],
        });

        const polyline = new ymaps.Polyline(
          ROUTE.map((p) => p.coords),
          { hintContent: "Маршрут операции" },
          { strokeColor: "#ff7900", strokeWidth: 4, strokeOpacity: 0.9 },
        );
        map.geoObjects.add(polyline);

        ROUTE.forEach((p, i) => {
          const placemark = new ymaps.Placemark(
            p.coords,
            {
              balloonContent: `<b>Точка ${i + 1}</b><br/>${p.name}`,
              iconCaption: `${i + 1}. ${p.name}`,
            },
            { preset: "islands#orangeStretchyIcon" },
          );
          map.geoObjects.add(placemark);
        });

        try {
          map.setBounds(map.geoObjects.getBounds(), { checkZoomRange: true });
        } catch {}
      })
      .catch((e) => {
        if (ref.current) {
          ref.current.innerHTML = `<div style="padding:1rem;color:#ff7900;text-align:center;font-size:0.85rem">Карта недоступна: ${e.message}</div>`;
        }
      });

    return () => {
      cancelled = true;
      try { map?.destroy(); } catch {}
    };
  }, []);

  return (
    <section className="border-2 border-primary/40 bg-card">
      <div className="border-b border-primary/40 bg-secondary px-4 py-2">
        <h2 className="text-sm uppercase tracking-widest text-primary">◉ Маршрут операции</h2>
        <p className="text-xs text-secondary-foreground/70">
          Красноярск → Пекин → Гонконг → Дананг → Макао → Пекин
        </p>
      </div>
      <div ref={ref} className="h-[400px] w-full" />
    </section>
  );
}
