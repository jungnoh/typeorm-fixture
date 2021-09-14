import { EntityManager } from 'typeorm';
import { FixtureBridge } from '../root/bridge';
import { Type, UnPromisify } from '../types';
import BaseFactory from './BaseFactory';

export default abstract class BaseFixture<T = void> {
  constructor(private readonly bridge: FixtureBridge) {}

  public abstract install(manager: EntityManager): Promise<T>;

  protected fixtureResultOf<FixtureType extends BaseFixture<unknown>>(
    type: Type<FixtureType>
  ): UnPromisify<ReturnType<FixtureType['install']>> {
    const result = this.bridge.fixtureResultOf(type);
    if (!result) {
      throw new Error(`Cannot load result of fixture ${type.name}`);
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
}
