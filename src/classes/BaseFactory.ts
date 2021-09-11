import { FactoryBridge } from '../root/bridge';
import { PartialProperties, Type } from '../types';

export default abstract class BaseFactory<T> {
  constructor(private readonly bridge: FactoryBridge) {}

  public abstract random(): T;

  public randomMany(count: number): T[] {
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.random());
    }
    return result;
  }

  public partial(overwrite: PartialProperties<T>): T {
    const item = this.random();
    for (const key of Object.keys(overwrite) as (keyof T)[]) {
      item[key] = overwrite[key as keyof PartialProperties<T>] as T[typeof key];
    }
    return item;
  }

  public partialMany(count: number, overwrite: PartialProperties<T>): T[] {
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.partial(overwrite));
    }
    return result;
  }

  protected factoryOf<EntityType>(
    type: Type<EntityType>
  ): BaseFactory<EntityType> {
    const result = this.bridge.getFactoryInstance(type);
    if (!result) {
      throw new Error(`Cannot find factory of ${type.name}`);
    }
    return result;
  }
}
