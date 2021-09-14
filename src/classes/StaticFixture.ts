import DynamicFixture from './DynamicFixture';

export default abstract class StaticFixture<T = void> extends DynamicFixture<T, undefined> {}
