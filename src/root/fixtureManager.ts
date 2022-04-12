import { EntityManager, getManager } from 'typeorm';
import BaseDynamicFixture from '../classes/DynamicFixture';
import {
  DynamicFixtureConstructor,
  FixtureConstructor,
  StaticFixtureConstructor,
} from '../classes/types';
import { CLASS_DEPENDENCIES } from '../decorators/constants';
import { FixtureType, getFixtureType, getIdentifier } from '../decorators/identifiers';
import { MockedEntityManager } from '../mock/EntityManager';
import { createMock, PartialFuncReturn } from '../util/mock';
import { runWithNoConnection, runWithScopedConnection } from './connection';
import resolveLoadOrder from './dependency';

export interface FixtureLoadFilters {
  only?: FixtureConstructor[];
  propagateDependencies?: boolean;
}

export interface FixtureConstructors {
  dynamic: DynamicFixtureConstructor[];
  static: StaticFixtureConstructor[];
}

export interface FixtureManagerOptions {
  mockDatabase: boolean;
}

export default class FixtureManager {
  private mockedManager = createMock<EntityManager>(
    new MockedEntityManager() as unknown as PartialFuncReturn<EntityManager>
  );

  public get manager(): EntityManager {
    return this.managerOptions.mockDatabase ? this.mockedManager : getManager();
  }

  constructor(
    private readonly constructors: FixtureConstructors,
    private readonly instantiator: (
      buildMe: FixtureConstructor
    ) => BaseDynamicFixture<unknown, unknown>,
    private readonly onFixtureResult: (key: string, value: unknown) => void,
    private readonly managerOptions: FixtureManagerOptions
  ) {}

  public async loadAll(options?: FixtureLoadFilters): Promise<void> {
    let loadOrder: string[];

    if (options?.only) {
      const propagate = options.propagateDependencies ?? true;
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
      if (getFixtureType(fixtureMap[key]) !== FixtureType.STATIC) {
        continue;
      }
      const instance = this.instantiator(fixtureMap[key]);
      let result;
      if (this.managerOptions.mockDatabase) {
        result = await runWithNoConnection(
          this.mockedManager,
          async (connection) => await instance.install(connection, undefined)
        );
      } else {
        result = await runWithScopedConnection(
          fixtureMap[key],
          async (connection) => await instance.install(connection, undefined)
        );
      }
      this.onFixtureResult(key, result);
    }
  }

  private buildDependencyInput() {
    return [...this.constructors.dynamic, ...this.constructors.static].map((item) => {
      const dependencies = Reflect.getMetadata(CLASS_DEPENDENCIES, item.prototype);
      return {
        dependencies: this.depListToString(dependencies),
        key: getIdentifier(item),
      };
    });
  }

  private buildFixtureMap(): Record<string, FixtureConstructor> {
    return [...this.constructors.dynamic, ...this.constructors.static].reduce((prev, now) => {
      return { ...prev, [getIdentifier(now)]: now };
    }, {});
  }

  private depListToString(list: FixtureConstructor[]) {
    return list.map((item) => getIdentifier(item));
  }
}
