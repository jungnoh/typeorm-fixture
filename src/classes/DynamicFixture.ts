import { EntityManager } from 'typeorm';
import { FixtureBridge } from '../root/bridge';
import { Type, UnPromisify } from '../types';
import BaseFactory from './BaseFactory';
import BaseStaticFixture from './StaticFixture';

export default abstract class BaseDynamicFixture<ResultType, ParameterType> {
  constructor(private readonly bridge: FixtureBridge) {}

  public abstract install(manager: EntityManager, options: ParameterType): Promise<ResultType>;

  protected fixtureResultOf<FixtureType extends BaseStaticFixture<unknown>>(
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
