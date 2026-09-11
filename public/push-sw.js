// Total-IK push service worker.
// Deliberately has NO fetch/caching handlers — it only receives push messages,
// so it can never serve stale app chunks.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = { title: "Total-IK", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Total-IK";
  const options = {
    body: payload.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
    data: { link: payload.link || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(link);
            } catch (err) {
              // ignore cross-origin navigation errors
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(link);
      }
    })(),
  );
});
