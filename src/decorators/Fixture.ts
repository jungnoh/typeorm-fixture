/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import {
  CLASS_DEPENDENCIES,
  CLASS_IDENTIFIER,
  FIXTURE_MARK,
  FIXTURE_TX_LEVEL,
  FIXTURE_TYPE,
  MARK_VALUE,
} from './constants';
import BaseDynamicFixture from '../classes/DynamicFixture';
import { FixtureOptions } from './types';
import { createFixtureIdentifier, FixtureType } from './identifiers';
import BaseStaticFixture from '../classes/StaticFixture';

function commonFixtureMarks<
  T extends { new (...args: any[]): BaseDynamicFixture<unknown, unknown> }
>(target: T, options?: FixtureOptions) {
  const deps = options?.dependencies ?? [];
  Reflect.defineMetadata(CLASS_DEPENDENCIES, deps, target.prototype);

  if (Reflect.hasMetadata(FIXTURE_MARK, target.prototype)) {
    throw new Error(`@Fixture must be used only once for '${target.name}'`);
  }
  Reflect.defineMetadata(FIXTURE_MARK, MARK_VALUE, target.prototype);
  Reflect.defineMetadata(FIXTURE_TX_LEVEL, options?.isolationLevel ?? undefined, target.prototype);
}

export function StaticFixture<T extends { new (...args: any[]): BaseStaticFixture<unknown> }>(
  options?: FixtureOptions
) {
  return (target: T): void => {
    commonFixtureMarks(target, options);
    Reflect.defineMetadata(
      CLASS_IDENTIFIER,
      createFixtureIdentifier(FixtureType.STATIC, target),
      target.prototype
    );
    Reflect.defineMetadata(FIXTURE_TYPE, FixtureType.STATIC, target.prototype);
  };
}

export function DynamicFixture<
  T extends {
    new (...args: any[]): BaseDynamicFixture<unknown, unknown>;
  }
>(options?: FixtureOptions) {
  return (target: T): void => {
    commonFixtureMarks(target, options);
    Reflect.defineMetadata(
      CLASS_IDENTIFIER,
      createFixtureIdentifier(FixtureType.DYNAMIC, target),
      target.prototype
    );
    Reflect.defineMetadata(FIXTURE_TYPE, FixtureType.DYNAMIC, target.prototype);
  };
}
