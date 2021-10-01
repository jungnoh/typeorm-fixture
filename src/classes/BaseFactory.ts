import { EntityManager } from 'typeorm';
import { FACTORY_TARGET } from '../decorators/constants';
import { FactoryBridge } from '../root/bridge';
import { PartialProperties, PromisifyObject, Type } from '../types';
import { overwriteProperties } from '../util/object';

interface IFactory<T> {
  random(): T;
  randomMany(count: number): T[];
  partial(overwrite: PartialProperties<T>): T;
  partialMany(count: number, overwrite: PartialProperties<T>): T[];
  partialMap(overwrites: PartialProperties<T>[], common?: PartialProperties<T>): T[];
}

export default abstract class BaseFactory<T> implements IFactory<T> {
  constructor(private readonly bridge: FactoryBridge) {}

  protected abstract createRandom(overwrite: PartialProperties<T>): T | PartialProperties<T>;

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

  public partialMap(overwrites: PartialProperties<T>[], common?: PartialProperties<T>): T[] {
    return overwrites.map((ovewrite) => this.partial({ ...common, ...ovewrite }));
  }

  public saving(manager: EntityManager): PromisifyObject<IFactory<T>> {
    const repository = manager.getRepository(this.getEntityType());
    return {
      random: () => repository.save(this.random()),
      randomMany: (count: number) => repository.save(this.randomMany(count)),
      partial: (overwrite: PartialProperties<T>) => repository.save(this.partial(overwrite)),
      partialMany: (count: number, overwrite: PartialProperties<T>) =>
        repository.save(this.partialMany(count, overwrite)),
      partialMap: (overwrites: PartialProperties<T>[], common?: PartialProperties<T>) =>
        repository.save(this.partialMap(overwrites), common),
    };
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
    return overwriteProperties(newInstance, result);
  }

  protected getEntityType(): Type<T> {
    return Reflect.getMetadata(FACTORY_TARGET, this) as Type<T>;
  }
}
