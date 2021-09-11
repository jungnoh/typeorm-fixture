/* eslint-disable @typescript-eslint/ban-types */
import { BaseFactory } from '..';
import { Type } from '../types';
import { CLASS_IDENTIFIER, FACTORY_MARK, FACTORY_TARGET, MARK_VALUE } from './constants';

export function getFactoryIdentifier(typeName: string): string {
  return `FACTORY_${typeName}`;
}

export default function Factory<EntityType, T extends { new (...args: any[]): any }>(
  of: Type<EntityType>
) {
  return function (target: T) {
    if (Reflect.hasMetadata(FACTORY_MARK, target.prototype)) {
      throw new Error(`@Fixture must be used only once for '${target.name}'`);
    }
    Reflect.defineMetadata(FACTORY_MARK, MARK_VALUE, target.prototype);

    const factoryName = getFactoryIdentifier(of.name);
    Reflect.defineMetadata(CLASS_IDENTIFIER, factoryName, target.prototype);
    Reflect.defineMetadata(FACTORY_TARGET, of, target.prototype);

    return class extends target {
      constructor(...args: any[]) {
        super(...args);
        if (!(this instanceof BaseFactory)) {
          throw new Error(`'${target.name}' is not a BaseFactory'`);
        }
      }
    };
  };
}
