// app/utils/client-auth.ts
import logger from "./logger";

// -------------------------------------------------------------------
// 1. Read identity — MEDIC SESSION FIRST on the medic app
// -------------------------------------------------------------------
function getUserIdentity(): { id: string; name: string; role: string } {
  let id = "",
    name = "",
    role = "";

  if (typeof window !== "undefined") {
    // Medic session (primary on the medic app)
    try {
      const medicData = localStorage.getItem("medicSession");
      if (medicData) {
        const parsed = JSON.parse(medicData);
        const m = parsed.medic || parsed;
        id = m.id || "";
        name =
          m.fullName || `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "";
        role = "medic";
      }
    } catch {}

    // Patient session as fallback
    if (!id) {
      const sessionData = localStorage.getItem("userSession");
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          const user = session.user || session;
          id = user.id || "";
          name = user.fullName || user.name || user.userName || "";
          role = user.role || "";
        } catch {}
      }
    }

    // Legacy flat keys
    if (!id) id = localStorage.getItem("userId") || "";
    if (!name) name = localStorage.getItem("userName") || "";
    if (!role) role = localStorage.getItem("userRole") || "";
  }

  return { id, name, role };
}

// -------------------------------------------------------------------
// 2. Auth-endpoint detection — SHARED by all methods
// -------------------------------------------------------------------
function isAuthEndpointUrl(url: string): boolean {
  // Only routes that should legitimately 401 without redirecting:
  //  - /api/auth/*         (patient auth)
  //  - /api/medic/auth/*   (medic login/logout)
  //
  // Do NOT match /api/medic/ broadly — that would swallow 401s
  // from /api/medic/appointments, /api/medic/dashboard/stats, etc.
  return url.includes("/api/auth/") || url.includes("/api/medic/auth/");
}

function shouldRedirectToLogin(url: string): boolean {
  if (typeof window === "undefined") return false;
  if (isAuthEndpointUrl(url)) return false;
  const path = window.location.pathname;
  return path !== "/login" && path !== "/register" && path !== "/";
}

function clearAllSessions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("userSession");
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userRole");
  localStorage.removeItem("medicSession");
}

// -------------------------------------------------------------------
// 3. Build headers
// -------------------------------------------------------------------
async function buildHeaders(extraHeaders?: Record<string, string>) {
  const identity = getUserIdentity();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (identity.id) headers["x-user-id"] = identity.id;
  if (identity.name) headers["x-user-name"] = identity.name;
  if (identity.role) headers["x-user-role"] = identity.role;
  return { headers };
}

// -------------------------------------------------------------------
// 4. Safe body parse — never throws on HTML / empty responses
// -------------------------------------------------------------------
async function safeParseResponse(res: Response): Promise<{
  result: any;
  rawText: string;
}> {
  const rawText = await res.text();
  let result: any;
  try {
    result = rawText ? JSON.parse(rawText) : {};
  } catch {
    result = {
      error: `HTTP ${res.status}: ${res.statusText || "Request failed"}`,
    };
  }
  return { result, rawText };
}

// -------------------------------------------------------------------
// 5. authFetcher
// -------------------------------------------------------------------
export async function authFetcher(url: string, options?: RequestInit) {
  const { headers } = await buildHeaders(
    options?.headers as Record<string, string>,
  );

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    logger.warn({ url }, "Network error – likely offline");
    throw new Error("NETWORK_OFFLINE");
  }

  const text = await res.text();
  let result: any;
  try {
    result = JSON.parse(text);
  } catch {
    result = { error: `Invalid response (status ${res.status})` };
  }

  if (!res.ok) {
    logger.error(
      { url, status: res.status, body: text.substring(0, 200) },
      `API request failed: ${url} (${res.status})`,
    );

    if (res.status === 401) {
      if (shouldRedirectToLogin(url)) {
        clearAllSessions();
        window.location.href = "/login";
      }
      throw new Error("AUTH_REQUIRED");
    }

    throw new Error(
      result.error ||
        `HTTP ${res.status}: ${text.substring(0, 100)}${text.length > 100 ? "…" : ""}`,
    );
  }

  return result;
}

// -------------------------------------------------------------------
// 6. authPost
// -------------------------------------------------------------------
export async function authPost(url: string, data?: any) {
  const { headers } = await buildHeaders();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
    });
  } catch {
    throw new Error("NETWORK_OFFLINE");
  }

  const { result, rawText } = await safeParseResponse(res);

  if (!res.ok) {
    logger.error(
      { url, status: res.status, body: rawText.substring(0, 200) },
      `POST request failed: ${url} (${res.status})`,
    );
    if (res.status === 401) {
      if (shouldRedirectToLogin(url)) {
        clearAllSessions();
        window.location.href = "/login";
      }
      throw new Error("AUTH_REQUIRED");
    }
    throw new Error(`HTTP ${res.status}: ${result.error || res.statusText}`);
  }
  return result;
}

// -------------------------------------------------------------------
// 7. authPut
// -------------------------------------------------------------------
export async function authPut(url: string, data?: any) {
  const { headers } = await buildHeaders();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
    });
  } catch {
    throw new Error("NETWORK_OFFLINE");
  }

  const { result, rawText } = await safeParseResponse(res);

  if (!res.ok) {
    logger.error(
      { url, status: res.status, body: rawText.substring(0, 200) },
      `PUT request failed: ${url} (${res.status})`,
    );
    if (res.status === 401) {
      if (shouldRedirectToLogin(url)) {
        clearAllSessions();
        window.location.href = "/login";
      }
      throw new Error("AUTH_REQUIRED");
    }
    throw new Error(`HTTP ${res.status}: ${result.error || res.statusText}`);
  }
  return result;
}

// -------------------------------------------------------------------
// 8. authDelete
// -------------------------------------------------------------------
export async function authDelete(url: string) {
  const { headers } = await buildHeaders();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "DELETE",
      headers,
      credentials: "include",
    });
  } catch {
    throw new Error("NETWORK_OFFLINE");
  }

  const { result, rawText } = await safeParseResponse(res);

  if (!res.ok) {
    logger.error(
      { url, status: res.status, body: rawText.substring(0, 200) },
      `DELETE request failed: ${url} (${res.status})`,
    );
    if (res.status === 401) {
      if (shouldRedirectToLogin(url)) {
        clearAllSessions();
        window.location.href = "/login";
      }
      throw new Error("AUTH_REQUIRED");
    }
    throw new Error(`HTTP ${res.status}: ${result.error || res.statusText}`);
  }
  return result;
}

// -------------------------------------------------------------------
// 9. authPatch (optional — same shape, sends PATCH)
// -------------------------------------------------------------------
export async function authPatch(url: string, data?: any) {
  const { headers } = await buildHeaders();
  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
      credentials: "include",
    });
  } catch {
    throw new Error("NETWORK_OFFLINE");
  }

  const { result, rawText } = await safeParseResponse(res);

  if (!res.ok) {
    logger.error(
      { url, status: res.status, body: rawText.substring(0, 200) },
      `PATCH request failed: ${url} (${res.status})`,
    );
    if (res.status === 401) {
      if (shouldRedirectToLogin(url)) {
        clearAllSessions();
        window.location.href = "/login";
      }
      throw new Error("AUTH_REQUIRED");
    }
    throw new Error(`HTTP ${res.status}: ${result.error || res.statusText}`);
  }
  return result;
}
