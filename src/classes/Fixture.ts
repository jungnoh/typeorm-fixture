import { Connection } from 'typeorm';
import { CLASS_IDENTIFIER } from '../decorators/constants';
import { FixtureBridge } from '../root/bridge';
import { Type, UnPromisify } from '../types';
import BaseFactory from './Factory';

export default abstract class BaseFixture<T = void> {
  constructor(private readonly bridge: FixtureBridge) {}

  public abstract install(connection: Connection): Promise<T>;

  protected loadFixtureResult<FixtureType extends BaseFixture<unknown>>(
    type: Type<FixtureType>
  ): UnPromisify<ReturnType<FixtureType['install']>> {
    const result = this.bridge.getFixtureResult(type);
    if (!result) {
      throw new Error(`Cannot load result of fixture ${type.name}`);
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

  protected getFixtureName(): string {
    return Reflect.getMetadata(CLASS_IDENTIFIER, this);
  }
}
