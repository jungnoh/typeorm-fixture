// Adopted from @golevelup/ts-jest
// https://github.com/golevelup/nestjs/tree/master/packages/testing
// Copyright (c) 2019 Jesse Carter

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>;
};

export type PartialFuncReturn<T> = {
  [K in keyof T]?: T[K] extends (...args: infer A) => infer U
    ? (...args: A) => PartialFuncReturn<U>
    : DeepPartial<T[K]>;
};

export type DeepMocked<T> = {
  [K in keyof T]: Required<T>[K] extends (...args: any[]) => infer U
    ? (...args: jest.ArgsType<T[K]>) => DeepMocked<U>
    : T[K];
} & T;

const createRecursiveMockProxy = () => {
  const cache = new Map<string | number | symbol, any>();

  const proxy: any = new Proxy(
    {},
    {
      get: (obj, prop) => {
        const propName = prop.toString();
        if (cache.has(prop)) {
          return cache.get(prop);
        }

        const checkProp = obj[prop as keyof typeof obj];

        let mockedProp;
        if (prop in obj) {
          mockedProp = typeof checkProp === 'function' ? () => undefined : checkProp;
        } else {
          mockedProp = propName === 'then' ? undefined : createRecursiveMockProxy();
        }
        cache.set(prop, mockedProp);

        return mockedProp;
      },
    }
  );

  return () => proxy;
};

export const createMock = <T extends object>(partial: PartialFuncReturn<T> = {}): DeepMocked<T> => {
  const cache = new Map<string | number | symbol, any>();

  const proxy = new Proxy(partial, {
    get: (obj, prop) => {
      if (
        prop === 'constructor' ||
        prop === 'inspect' ||
        prop === 'then' ||
        (typeof prop === 'symbol' && prop.toString() === 'Symbol(util.inspect.custom)')
      ) {
        return undefined;
      }

      if (cache.has(prop)) {
        return cache.get(prop);
      }

      const checkProp = obj[prop as keyof typeof obj];
      const mockedProp = prop in obj ? checkProp : createRecursiveMockProxy();

      cache.set(prop, mockedProp);
      return mockedProp;
    },
  });

  return proxy as DeepMocked<T>;
};
