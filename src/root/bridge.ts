import BaseFactory from '../classes/BaseFactory';
import BaseFixture from '../classes/BaseFixture';
import { FixtureResult } from '../classes/types';
import { Type } from '../types';

export interface FixtureBridge {
  getFactoryInstance<EntityType>(
    type: Type<EntityType>,
    name?: string
  ): BaseFactory<EntityType> | undefined;
  fixtureResultOf<FixtureType extends BaseFixture<unknown>>(
    type: Type<FixtureType>
  ): FixtureResult<FixtureType> | undefined;
}

export interface FactoryBridge {
  getFactoryInstance<EntityType>(
    type: Type<EntityType>,
    name?: string
  ): BaseFactory<EntityType> | undefined;
}
