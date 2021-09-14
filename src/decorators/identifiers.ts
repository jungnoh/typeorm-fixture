import { FactoryConstructor, FixtureConstructor } from '../classes/types';
import { Type } from '../types';
import { CLASS_IDENTIFIER, DEFAULT_FACTORY_NAME } from './constants';

export enum FixtureType {
  STATIC = 'STATIC',
  DYNAMIC = 'DYNAMIC',
}

export function createFactoryIdentifier(
  of: Type<unknown>,
  name: string = DEFAULT_FACTORY_NAME
): string {
  return `FACTORY_${of.name}_${name}`;
}

export function createFixtureIdentifier(type: FixtureType, of: FixtureConstructor): string {
  return `FIXTURE_${type.toString()}_${of.name}`;
}

export function getIdentifier(of: FixtureConstructor | FactoryConstructor): string {
  const result: string | undefined = Reflect.getMetadata(CLASS_IDENTIFIER, of.prototype);
  if (!result) {
    throw new Error(`Cannot resolve identifer of ${of.name}`);
  }
  return result;
}
