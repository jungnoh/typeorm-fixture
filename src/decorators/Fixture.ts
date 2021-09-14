/* eslint-disable @typescript-eslint/ban-types */
import {
  CLASS_DEPENDENCIES,
  CLASS_IDENTIFIER,
  FIXTURE_MARK,
  FIXTURE_TX_LEVEL,
  MARK_VALUE,
} from './constants';
import BaseFixture from '../classes/BaseFixture';
import { FixtureOptions } from './types';
import { createFixtureIdentifier, FixtureType } from './identifiers';

export default function Fixture<T extends { new (...args: any[]): BaseFixture<unknown> }>(
  options?: FixtureOptions
) {
  return (target: T): void => {
    const deps = options?.dependencies ?? [];

    if (Reflect.hasMetadata(FIXTURE_MARK, target.prototype)) {
      throw new Error(`@Fixture must be used only once for '${target.name}'`);
    }
    Reflect.defineMetadata(FIXTURE_MARK, MARK_VALUE, target.prototype);

    Reflect.defineMetadata(
      CLASS_IDENTIFIER,
      createFixtureIdentifier(FixtureType.STATIC, target),
      target.prototype
    );
    Reflect.defineMetadata(CLASS_DEPENDENCIES, deps, target.prototype);
    Reflect.defineMetadata(
      FIXTURE_TX_LEVEL,
      options?.isolationLevel ?? undefined,
      target.prototype
    );
  };
}
