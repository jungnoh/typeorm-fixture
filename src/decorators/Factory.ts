/* eslint-disable @typescript-eslint/ban-types */
import { Type } from '../types';
import { CLASS_IDENTIFIER, FACTORY_MARK, MARK_VALUE } from './constants';

export function getFactoryIdentifier(typeName: string): string {
  return `FACTORY_${typeName}`;
}

export default function Factory<EntityType>(of: Type<EntityType>) {
  return (target: Function): void => {
    if (Reflect.hasMetadata(FACTORY_MARK, target.prototype)) {
      throw new Error(`@Fixture must be used only once for '${target.name}'`);
    }
    Reflect.defineMetadata(FACTORY_MARK, MARK_VALUE, target.prototype);

    const factoryName = getFactoryIdentifier(of.name);
    Reflect.defineMetadata(CLASS_IDENTIFIER, factoryName, target.prototype);
  };
}
