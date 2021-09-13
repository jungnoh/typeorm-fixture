import BaseFactory from '../classes/BaseFactory';
import BaseFixture from '../classes/BaseFixture';
import { FactoryConstructor, FixtureConstructor, FixtureResult } from '../classes/types';
import { CLASS_IDENTIFIER, DEFAULT_FACTORY_NAME, FACTORY_NAME } from '../decorators/constants';
import { getFactoryIdentifier } from '../decorators/Factory';
import { Type } from '../types';
import FixtureManager from './fixtureManager';
import Importer, { ImportResult } from './importer';

export interface FixtureRootOptions {
  filePatterns?: string[];
  factories?: FactoryConstructor[];
  fixtures?: FixtureConstructor[];
}

export default class FixtureRoot {
  constructor(private readonly options: FixtureRootOptions) {}

  private constructorCache?: ImportResult;
  private factoryInstanceCache: Record<string, Record<string, BaseFactory<unknown>>> = {};
  private fixtureResultCache: Record<string, unknown> = {};

  public async loadFiles(): Promise<void> {
    if (this.constructorCache) {
      return;
    }
    this.constructorCache = await new Importer(this.options.filePatterns ?? []).import();
    this.constructorCache.factories.push(...(this.options.factories ?? []));
    this.constructorCache.fixtures.push(...(this.options.fixtures ?? []));
    for (const factoryConstructor of this.constructorCache.factories) {
      const targetName = Reflect.getMetadata(CLASS_IDENTIFIER, factoryConstructor.prototype);
      const name = Reflect.getMetadata(FACTORY_NAME, factoryConstructor.prototype);
      if (!(targetName in this.factoryInstanceCache)) {
        this.factoryInstanceCache[targetName] = {};
      }
      this.factoryInstanceCache[targetName][name] = this.instantiateFactory(factoryConstructor);
    }
  }

  public async installFixtures(): Promise<void> {
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
    await manager.loadAll();
  }

  public getFactoryInstance<EntityType>(
    type: Type<EntityType>,
    name: string = DEFAULT_FACTORY_NAME
  ): BaseFactory<EntityType> | undefined {
    const key = getFactoryIdentifier(type.name);
    if (key in this.factoryInstanceCache && name in this.factoryInstanceCache[key]) {
      return this.factoryInstanceCache[key][name] as BaseFactory<EntityType>;
    }
    return undefined;
  }

  public getFixtureResult<T extends BaseFixture<unknown>>(
    type: Type<T>
  ): FixtureResult<T> | undefined {
    const key = Reflect.getMetadata(CLASS_IDENTIFIER, type.prototype);
    if (!key) {
      throw new Error(`'${type.name}' is not a valid fixture.`);
    }
    if (key in this.fixtureResultCache) {
      return this.fixtureResultCache[key] as FixtureResult<T>;
    }
    return undefined;
  }

  private instantiateFactory(buildMe: FactoryConstructor) {
    return new buildMe({
      getFactoryInstance: (type) => this.getFactoryInstance(type),
    });
  }

  private instantiateFixture(buildMe: FixtureConstructor) {
    return new buildMe({
      getFactoryInstance: (type) => this.getFactoryInstance(type),
      getFixtureResult: (type) => this.getFixtureResult(type),
    });
  }
}
