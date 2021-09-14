import BaseFactory from '../classes/BaseFactory';
import StaticFixture from '../classes/StaticFixture';
import { FactoryConstructor, FixtureConstructor, FixtureResult } from '../classes/types';
import { createFactoryIdentifier, getIdentifier } from '../decorators/identifiers';
import { Type } from '../types';
import FixtureManager, { FixtureLoadFilters } from './fixtureManager';
import Importer, { ImportResult } from './importer';

export interface FixtureRootOptions {
  filePatterns?: string[];
  factories?: FactoryConstructor[];
  fixtures?: FixtureConstructor[];
}

export default class FixtureRoot {
  constructor(private readonly options: FixtureRootOptions) {}

  private constructorCache?: ImportResult;
  private factoryInstanceCache: Record<string, BaseFactory<unknown>> = {};
  private fixtureResultCache: Record<string, unknown> = {};

  public async loadFiles(): Promise<void> {
    if (this.constructorCache) {
      return;
    }
    this.constructorCache = await new Importer(this.options.filePatterns ?? []).import();
    this.constructorCache.factories.push(...(this.options.factories ?? []));
    this.constructorCache.fixtures.push(...(this.options.fixtures ?? []));
    for (const factoryConstructor of this.constructorCache.factories) {
      const targetName = getIdentifier(factoryConstructor);
      this.factoryInstanceCache[targetName] = this.instantiateFactory(factoryConstructor);
    }
  }

  public async installFixtures(options?: FixtureLoadFilters): Promise<void> {
    if (!this.constructorCache) {
      throw new Error('Fixture files have not been imported yet');
    }
    const manager = new FixtureManager(
      this.constructorCache.fixtures,
      (buildMe) => this.instantiateFixture(buildMe),
      (key, value) => {
        this.fixtureResultCache[key] = value;
      }
    );
    await manager.loadAll(options);
  }

  public clearFixtureResult(): void {
    this.fixtureResultCache = {};
  }

  public factoryOf<EntityType>(
    type: Type<EntityType>,
    name?: string
  ): BaseFactory<EntityType> | undefined {
    const key = createFactoryIdentifier(type, name);
    if (key in this.factoryInstanceCache) {
      return this.factoryInstanceCache[key] as BaseFactory<EntityType>;
    }
    return undefined;
  }

  public fixtureResultOf<T extends StaticFixture<unknown>>(
    type: Type<T>
  ): FixtureResult<T> | undefined {
    const key = getIdentifier(type);
    if (key in this.fixtureResultCache) {
      return this.fixtureResultCache[key] as FixtureResult<T>;
    }
    return undefined;
  }

  private instantiateFactory(buildMe: FactoryConstructor) {
    return new buildMe({
      getFactoryInstance: (type) => this.factoryOf(type),
    });
  }

  private instantiateFixture(buildMe: FixtureConstructor) {
    return new buildMe({
      getFactoryInstance: (type) => this.factoryOf(type),
      fixtureResultOf: (type) => this.fixtureResultOf(type),
    });
  }
}
