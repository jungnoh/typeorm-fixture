/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
export type Type<T> = new (...args: any[]) => T;

export type UnPromisify<T> = T extends Promise<infer U> ? U : T;

type PropertyKeys<T> = {
  [P in keyof T]: T[P] extends Function ? never : P;
}[keyof T];

export type Properties<T> = Pick<T, PropertyKeys<T>>;
export type PartialProperties<T> = Partial<Properties<T>>;

export type PromisifyFunction<F extends (...args: any[]) => any> = (
  ...args: Parameters<F>
) => Promise<ReturnType<F>>;

export type PromisifyObject<Base> = {
  [Key in keyof Base]: Base[Key] extends (...args: any[]) => any
    ? PromisifyFunction<Base[Key]>
    : never;
};

export type MapOfKey<T, U extends keyof T> = T[U] extends string | number | symbol
  ? Record<T[U], T>
  : never;
