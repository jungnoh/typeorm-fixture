import { EntityManager, getManager } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import BaseFixture from '../classes/BaseFixture';
import { FixtureConstructor } from '../classes/types';
import { CLASS_DEPENDENCIES, CLASS_IDENTIFIER, FIXTURE_TX_LEVEL } from '../decorators/constants';
import resolveLoadOrder from './dependency';

export interface FixtureLoadFilters {
  only?: FixtureConstructor[];
  propagateDependencies?: boolean;
}

export default class FixtureManager {
  constructor(
    private readonly constructors: FixtureConstructor[],
    private readonly instantiator: (buildMe: FixtureConstructor) => BaseFixture<unknown>,
    private readonly onFixtureResult: (key: string, value: unknown) => void
  ) {}

  public async loadAll(options?: FixtureLoadFilters): Promise<void> {
    let loadOrder: string[];

    if (options?.only) {
      const propagate = options?.propagateDependencies ?? true;
      const onlyKeys = options.only.map((item) =>
        Reflect.getMetadata(CLASS_IDENTIFIER, item.prototype)
      );
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
        async (connection) => await instance.install(connection)
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
      const name = Reflect.getMetadata(CLASS_IDENTIFIER, item.prototype);
      return {
        dependencies: this.depListToString(dependencies),
        key: name,
      };
    });
  }

  private buildFixtureMap(): Record<string, FixtureConstructor> {
    return this.constructors.reduce((prev, now) => {
      const name = Reflect.getMetadata(CLASS_IDENTIFIER, now.prototype);
      return { ...prev, [name]: now };
    }, {});
  }

  private depListToString(list: FixtureConstructor[]) {
    return list.map((v) => Reflect.getMetadata(CLASS_IDENTIFIER, v.prototype));
  }
}
