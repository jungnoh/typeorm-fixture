import { FactoryBridge, FixtureBridge } from '../root/bridge';
import { UnPromisify } from '../types';
import BaseFactory from './BaseFactory';
import BaseFixture from './BaseFixture';

export type FixtureConstructor = new (bridge: FixtureBridge) => BaseFixture<unknown>;
export type FactoryConstructor = new (bridge: FactoryBridge) => BaseFactory<unknown>;
export type FixtureResult<FixtureType extends BaseFixture<unknown>> = UnPromisify<
  ReturnType<FixtureType['install']>
>;
