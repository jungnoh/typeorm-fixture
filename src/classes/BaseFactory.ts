import { FACTORY_TARGET } from '../decorators/constants';
import { FactoryBridge } from '../root/bridge';
import { PartialProperties, Properties, Type } from '../types';

export default abstract class BaseFactory<T> {
  constructor(private readonly bridge: FactoryBridge) {}

  protected abstract createRandom(overwrite: PartialProperties<T>): T | Properties<T>;

  public random(): T {
    return this.instanceEnsuredCreateRandom({});
  }

  public randomMany(count: number): T[] {
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.random());
    }
    return result;
  }

  public partial(overwrite: PartialProperties<T>): T {
    const item = this.instanceEnsuredCreateRandom(overwrite);
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

  protected factoryOf<EntityType>(type: Type<EntityType>, name?: string): BaseFactory<EntityType> {
    const result = this.bridge.getFactoryInstance(type, name);
    if (!result) {
      throw new Error(`Cannot find factory of ${type.name}`);
    }
    return result;
  }

  private instanceEnsuredCreateRandom(overwrite: PartialProperties<T>): T {
    const entityType = this.getEntityType();
    const result = this.createRandom(overwrite);
    if (result instanceof entityType) {
      return result as T;
    }
    const newInstance = new entityType();
    return this.overwriteProperties(newInstance, result);
  }

  private overwriteProperties<U>(target: U, overwrite: PartialProperties<U>): U {
    for (const key of Object.keys(overwrite) as (keyof U)[]) {
      target[key] = overwrite[key as keyof PartialProperties<U>] as U[typeof key];
    }
    return target;
  }

  protected getEntityType(): Type<T> {
    return Reflect.getMetadata(FACTORY_TARGET, this) as Type<T>;
  }
}
