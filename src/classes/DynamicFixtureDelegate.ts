import { runWithNoConnection, runWithScopedConnection } from '../root/connection';
import { Type } from '../types';
import BaseDynamicFixture from './DynamicFixture';

export interface DynamicFixtureDelegateOptions {
  mockDatabase: boolean;
}

export default class DynamicFixtureDelegate<T, U> {
  constructor(
    private readonly type: Type<BaseDynamicFixture<T, U>>,
    public readonly instance: BaseDynamicFixture<T, U>,
    private readonly options: DynamicFixtureDelegateOptions
  ) {}

  public async install(options: U): Promise<T> {
    if (this.options.mockDatabase) {
      return await runWithNoConnection<T>(
        this.type,
        async (manager) => await this.instance.install(manager, options)
      );
    }
    return await runWithScopedConnection<T>(
      this.type,
      async (manager) => await this.instance.install(manager, options)
    );
  }
}
