import BaseFactory from '../classes/BaseFactory';
import BaseDynamicFixture from '../classes/DynamicFixture';
import DynamicFixtureDelegate from '../classes/DynamicFixtureDelegate';
import BaseStaticFixture from '../classes/StaticFixture';
import {
  DynamicFixtureConstructor,
  FactoryConstructor,
  FixtureConstructor,
  FixtureResult,
} from '../classes/types';
import { createFactoryIdentifier, getIdentifier } from '../decorators/identifiers';
import { Type } from '../types';
import FixtureManager, { FixtureLoadFilters } from './fixtureManager';
import Importer, { ImportResult, sortConstructors } from './importer';

export interface FixtureRootOptions {
  filePatterns?: string[];
  factories?: FactoryConstructor[];
  fixtures?: FixtureConstructor[];
}

export default class FixtureRoot {
  constructor(private readonly options: FixtureRootOptions) {}

  private constructorCache?: ImportResult;
  private factoryInstanceCache: Record<string, BaseFactory<unknown>> = {};
  private staticFixtureResultCache: Record<string, unknown> = {};
  private dynamicFixtureConstructors: Record<string, DynamicFixtureConstructor> = {};

  public async loadFiles(): Promise<void> {
    if (this.constructorCache) {
      return;
    }
    this.constructorCache = await new Importer(this.options.filePatterns ?? []).import();

    const manuallyImportedItems = sortConstructors([
      ...(this.options.factories ?? []),
      ...(this.options.fixtures ?? []),
    ]);
    this.constructorCache.dynamicFixtures.push(...manuallyImportedItems.dynamicFixtures);
    this.constructorCache.staticFixtures.push(...manuallyImportedItems.staticFixtures);
    this.constructorCache.factories.push(...manuallyImportedItems.factories);

    for (const factoryConstructor of this.constructorCache.factories) {
      const targetName = getIdentifier(factoryConstructor);
      this.factoryInstanceCache[targetName] = this.instantiateFactory(factoryConstructor);
    }
    for (const dynamicFixture of this.constructorCache.dynamicFixtures) {
      const targetName = getIdentifier(dynamicFixture);
      this.dynamicFixtureConstructors[targetName] = dynamicFixture;
    }
  }

  public async installFixtures(options?: FixtureLoadFilters): Promise<void> {
    if (!this.constructorCache) {
      throw new Error('Fixture files have not been imported yet');
    }
    const manager = new FixtureManager(
      {
        dynamic: this.constructorCache.dynamicFixtures,
        static: this.constructorCache.staticFixtures,
      },
      (buildMe) => this.instantiateFixture(buildMe),
      (key, value) => {
        this.staticFixtureResultCache[key] = value;
      }
    );
    await manager.loadAll(options);
  }

  public clearFixtureResult(): void {
    this.staticFixtureResultCache = {};
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

  public fixtureResultOf<T extends BaseStaticFixture<unknown>>(
    type: Type<T>
  ): FixtureResult<T> | undefined {
    const key = getIdentifier(type);
    if (key in this.staticFixtureResultCache) {
      return this.staticFixtureResultCache[key] as FixtureResult<T>;
    }
    return undefined;
  }

  public dynamicFixtureOf<T, U>(
    type: Type<BaseDynamicFixture<T, U>>
  ): DynamicFixtureDelegate<T, U> | undefined {
    const key = getIdentifier(type);
    if (key in this.dynamicFixtureConstructors) {
      const instance = this.instantiateFixture(this.dynamicFixtureConstructors[key]);
      return new DynamicFixtureDelegate<T, U>(
        type,
        instance as Exclude<BaseDynamicFixture<T, U>, BaseStaticFixture<T>>
      );
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
      dynamicFixtureOf: (type) => this.dynamicFixtureOf(type),
    });
  }
}
