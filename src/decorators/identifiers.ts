import { FactoryConstructor, FixtureConstructor } from '../classes/types';
import { Type } from '../types';
import { CLASS_IDENTIFIER, DEFAULT_FACTORY_NAME, FIXTURE_TYPE } from './constants';

export enum FixtureType {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC',
}

function createRandomIdentifier() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function createFactoryIdentifier(
  of: Type<unknown>,
  name: string = DEFAULT_FACTORY_NAME
): string {
  return `FACTORY_${of.name}_${name}`;
}

export function createFixtureIdentifier(type: FixtureType, of: FixtureConstructor): string {
  return `FIXTURE_${type.toString()}_${of.name}_${createRandomIdentifier()}`;
}

export function getIdentifier(of: FixtureConstructor | FactoryConstructor): string {
  const result: string | undefined = Reflect.getMetadata(CLASS_IDENTIFIER, of.prototype);
  if (!result) {
    throw new Error(`Cannot resolve identifer of ${of.name}`);
  }
  return result;
}

export function getFixtureType(of: FixtureConstructor): FixtureType {
  return Reflect.getMetadata(FIXTURE_TYPE, of.prototype);
}
