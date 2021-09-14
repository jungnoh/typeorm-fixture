import BaseFactory from '../classes/BaseFactory';
import BaseDynamicFixture from '../classes/DynamicFixture';
import DynamicFixtureDelegate from '../classes/DynamicFixtureDelegate';
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
  dynamicFixtureOf<T, U>(
    type: Type<BaseDynamicFixture<T, U>>
  ): DynamicFixtureDelegate<T, U> | undefined;
}

export interface FactoryBridge {
  getFactoryInstance<EntityType>(
    type: Type<EntityType>,
    name?: string
  ): BaseFactory<EntityType> | undefined;
}
