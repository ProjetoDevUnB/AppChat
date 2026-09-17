export class TimeoutError extends Error {}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError()), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}
