/* eslint-disable @typescript-eslint/ban-types */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Type<T> = new (...args: any[]) => T;

export type UnPromisify<T> = T extends Promise<infer U> ? U : T;

type PropertyKeys<T> = {
  [P in keyof T]: T[P] extends Function ? never : P;
}[keyof T];

export type Properties<T> = Pick<T, PropertyKeys<T>>;
export type PartialProperties<T> = Partial<Properties<T>>;
