import 'reflect-metadata';

export { default as BaseStaticFixture } from './classes/StaticFixture';
export { default as BaseDynamicFixture } from './classes/DynamicFixture';
export { default as BaseFactory } from './classes/BaseFactory';
export { default as Factory } from './decorators/Factory';
export { StaticFixture, DynamicFixture } from './decorators/Fixture';
export { default as FixtureRoot } from './root';

// Utilities
export { Properties, PartialProperties, MapOfKey } from './types';
export { overwriteProperties, createMapByKey } from './util/object';
