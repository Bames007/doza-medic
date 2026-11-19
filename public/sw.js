// public/sw.js
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let data = {};
      try {
        data = event.data ? event.data.json() : {};
      } catch {
        data = {
          title: "Doza",
          body: event.data ? event.data.text() : "",
        };
      }

      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // Forward to any open tab so it can show a toast / play the chime.
      for (const c of clientsList) {
        try {
          c.postMessage({ type: "DOZA_NEW_MESSAGE", payload: data });
        } catch {}
      }

      // If a tab is already focused, don't also pop an OS notification.
      const hasFocused = clientsList.some((c) => c.focused);
      if (hasFocused) return;

      await self.registration.showNotification(data.title || "Doza", {
        body: data.body || "",
        icon: data.icon || "/icon-192.png",
        badge: data.badge || "/icon-72.png",
        tag: data.tag,
        data: {
          url: data.url || "/",
          appointmentId: data.appointmentId || null,
          role: data.role || null,
        },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const targetUrl = data.url || "/";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const c of clientsList) {
        try {
          await c.focus();
          if (data.appointmentId) {
            c.postMessage({
              type: "DOZA_OPEN_CHAT",
              appointmentId: data.appointmentId,
              role: data.role,
            });
          }
          return;
        } catch {}
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});