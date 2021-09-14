import { FactoryBridge, FixtureBridge } from '../root/bridge';
import { UnPromisify } from '../types';
import BaseFactory from './BaseFactory';
import DynamicFixture from './DynamicFixture';

export type FactoryConstructor = new (bridge: FactoryBridge) => BaseFactory<unknown>;

export type FixtureConstructor = new (bridge: FixtureBridge) => DynamicFixture<unknown, unknown>;

export type FixtureResult<FixtureType extends DynamicFixture<unknown, unknown>> = UnPromisify<
  ReturnType<FixtureType['install']>
>;
