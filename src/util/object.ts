import { PartialProperties, MapOfKey } from '../types';

export function overwriteProperties<T>(target: T, overwrite: PartialProperties<T>): T {
  for (const key of Object.keys(overwrite) as (keyof T)[]) {
    target[key] = overwrite[key as keyof PartialProperties<T>] as T[typeof key];
  }
  return target;
}

export function createMapByKey<T>(array: T[], key: keyof T): MapOfKey<T, typeof key> {
  return array.reduce(
    (prev, now) => ({ ...prev, [now[key] as unknown as string | number | symbol]: now }),
    {} as MapOfKey<T, typeof key>
  );
}
