export function stripHtml(value: string) {
  return value.replace(/[<>"'`]/g, (char) => {
    const map: Record<string, string> = {
      "<": "",
      ">": "",
      '"': "&quot;",
      "'": "&#39;",
      "`": ""
    };

    return map[char] ?? "";
  });
}

export function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") {
    return stripHtml(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeDeep(item)])
    ) as T;
  }

  return value;
}
