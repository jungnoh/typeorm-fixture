import { EntityManager, getManager } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import StaticFixture from '../classes/StaticFixture';
import { FixtureConstructor } from '../classes/types';
import { CLASS_DEPENDENCIES, FIXTURE_TX_LEVEL } from '../decorators/constants';
import { getIdentifier } from '../decorators/identifiers';
import resolveLoadOrder from './dependency';

export interface FixtureLoadFilters {
  only?: FixtureConstructor[];
  propagateDependencies?: boolean;
}

export default class FixtureManager {
  constructor(
    private readonly constructors: FixtureConstructor[],
    private readonly instantiator: (buildMe: FixtureConstructor) => StaticFixture<unknown>,
    private readonly onFixtureResult: (key: string, value: unknown) => void
  ) {}

  public async loadAll(options?: FixtureLoadFilters): Promise<void> {
    let loadOrder: string[];

    if (options?.only) {
      const propagate = options?.propagateDependencies ?? true;
      const onlyKeys = options.only.map((item) => getIdentifier(item));
      if (propagate) {
        loadOrder = resolveLoadOrder(this.buildDependencyInput(), {
          traversalRoots: onlyKeys,
        });
      } else {
        loadOrder = resolveLoadOrder(this.buildDependencyInput(), {
          traversalRoots: onlyKeys,
          traversalNodes: onlyKeys,
        });
      }
    } else {
      loadOrder = resolveLoadOrder(this.buildDependencyInput());
    }

    const fixtureMap = this.buildFixtureMap();
    for (const key of loadOrder) {
      const instance = this.instantiator(fixtureMap[key]);
      const result = await this.runWithScopedConnection(
        fixtureMap[key],
        async (connection) => await instance.install(connection, undefined)
      );
      this.onFixtureResult(key, result);
    }
  }

  private async runWithScopedConnection<T>(
    fixture: FixtureConstructor,
    func: (entityManager: EntityManager) => Promise<T>
  ): Promise<T> {
    const isolationLevel = Reflect.getMetadata(FIXTURE_TX_LEVEL, fixture.prototype) as
      | IsolationLevel
      | 'default'
      | undefined;
    const needsTransaction = !!isolationLevel;

    // TODO: Allow custom connections
    if (!needsTransaction) {
      return await func(getManager());
    }

    let result: T;
    if (isolationLevel === 'default') {
      await getManager().transaction(async (entityManager) => {
        result = await func(entityManager);
      });
      return result!;
    }
    await getManager().transaction(isolationLevel, async (entityManager) => {
      result = await func(entityManager);
    });
    return result!;
  }

  private buildDependencyInput() {
    return this.constructors.map((item) => {
      const dependencies = Reflect.getMetadata(CLASS_DEPENDENCIES, item.prototype);
      return {
        dependencies: this.depListToString(dependencies),
        key: getIdentifier(item),
      };
    });
  }

  private buildFixtureMap(): Record<string, FixtureConstructor> {
    return this.constructors.reduce((prev, now) => {
      return { ...prev, [getIdentifier(now)]: now };
    }, {});
  }

  private depListToString(list: FixtureConstructor[]) {
    return list.map((item) => getIdentifier(item));
  }
}
