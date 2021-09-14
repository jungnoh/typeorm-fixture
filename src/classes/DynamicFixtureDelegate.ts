import { runWithScopedConnection } from '../root/connection';
import { Type } from '../types';
import BaseDynamicFixture from './DynamicFixture';

export default class DynamicFixtureDelegate<T, U> {
  constructor(
    private readonly type: Type<BaseDynamicFixture<T, U>>,
    public readonly instance: BaseDynamicFixture<T, U>
  ) {}

  public async install(options: U): Promise<T> {
    return await runWithScopedConnection<T>(
      this.type,
      async (manager) => await this.instance.install(manager, options)
    );
  }
}
