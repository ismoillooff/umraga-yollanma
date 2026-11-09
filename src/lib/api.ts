export async function api<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers:
      options.body instanceof Blob
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      "Server bilan aloqa yo‘q. Birozdan keyin qayta urinib ko‘ring.",
    );
  }
  if (!response.ok)
    throw Object.assign(new Error(data.error || "So‘rov bajarilmadi."), {
      status: response.status,
    });
  return data as T;
}
