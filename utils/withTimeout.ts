export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms);
  });
  return Promise.race([
    promise.finally(() => { if (timer) clearTimeout(timer); }),
    timeoutPromise,
  ]);
}
