export async function requestJson<T = { message: string }>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "content-type": "application/json", ...options.headers }
  });
  const data = await response
    .json()
    .catch(() => ({ message: "The server could not complete this request." }));
  if (!response.ok) throw new Error(data.message ?? "Please try again.");
  return data as T;
}
