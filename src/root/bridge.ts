import BaseFactory from '../classes/BaseFactory';
import BaseStaticFixture from '../classes/StaticFixture';
import { FixtureResult } from '../classes/types';
import { Type } from '../types';

export interface FixtureBridge {
  getFactoryInstance<EntityType>(
    type: Type<EntityType>,
    name?: string
  ): BaseFactory<EntityType> | undefined;
  fixtureResultOf<FixtureType extends BaseStaticFixture<unknown>>(
    type: Type<FixtureType>
  ): FixtureResult<FixtureType> | undefined;
}

export interface FactoryBridge {
  getFactoryInstance<EntityType>(
    type: Type<EntityType>,
    name?: string
  ): BaseFactory<EntityType> | undefined;
}
