export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.furciai.com";

export function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("furci_admin_token") || "";
}

export async function adminFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("furci_admin_token");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  return res;
}
