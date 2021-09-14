import { FactoryBridge, FixtureBridge } from '../root/bridge';
import { UnPromisify } from '../types';
import BaseFactory from './BaseFactory';
import BaseDynamicFixture from './DynamicFixture';
import BaseStaticFixture from './StaticFixture';

export type FactoryConstructor = new (bridge: FactoryBridge) => BaseFactory<unknown>;

export type FixtureConstructor = new (bridge: FixtureBridge) => BaseDynamicFixture<
  unknown,
  unknown
>;

export type StaticFixtureConstructor = new (bridge: FixtureBridge) => BaseStaticFixture<unknown>;

export type DynamicFixtureOnly = Exclude<
  BaseDynamicFixture<unknown, unknown>,
  BaseStaticFixture<unknown>
>;

export type FixtureResult<FixtureType extends BaseDynamicFixture<unknown, unknown>> = UnPromisify<
  ReturnType<FixtureType['install']>
>;
