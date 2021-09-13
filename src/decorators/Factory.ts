/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import { BaseFactory } from '..';
import { Type } from '../types';
import {
  CLASS_IDENTIFIER,
  DEFAULT_FACTORY_NAME,
  FACTORY_MARK,
  FACTORY_NAME,
  FACTORY_TARGET,
  MARK_VALUE,
} from './constants';

interface FactoryDecoratorOptions {
  name?: string;
}

export function getFactoryIdentifier(typeName: string): string {
  return `FACTORY_${typeName}`;
}

export default function Factory<EntityType, T extends { new (...args: any[]): any }>(
  of: Type<EntityType>,
  options?: FactoryDecoratorOptions
) {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return function (target: T) {
    if (Reflect.hasMetadata(FACTORY_MARK, target.prototype)) {
      throw new Error(`@Fixture must be used only once for '${target.name}'`);
    }
    Reflect.defineMetadata(FACTORY_MARK, MARK_VALUE, target.prototype);

    const factoryName = getFactoryIdentifier(of.name);
    Reflect.defineMetadata(CLASS_IDENTIFIER, factoryName, target.prototype);
    Reflect.defineMetadata(FACTORY_TARGET, of, target.prototype);
    Reflect.defineMetadata(FACTORY_NAME, options?.name ?? DEFAULT_FACTORY_NAME, target.prototype);

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
