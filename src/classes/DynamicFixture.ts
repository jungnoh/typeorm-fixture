import { EntityManager } from 'typeorm';
import { FixtureBridge } from '../root/bridge';
import { Type, UnPromisify } from '../types';
import BaseFactory from './BaseFactory';
import StaticFixture from './StaticFixture';

export default abstract class DynamicFixture<ResultType, ParameterType> {
  constructor(private readonly bridge: FixtureBridge) {}

  public abstract install(manager: EntityManager, options: ParameterType): Promise<ResultType>;

  protected fixtureResultOf<FixtureType extends StaticFixture<unknown>>(
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
