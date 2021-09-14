import BaseDynamicFixture from './DynamicFixture';

export default abstract class BaseStaticFixture<T = void> extends BaseDynamicFixture<
  T,
  undefined
> {}
