import BaseFactory from '../classes/Factory';
import BaseFixture from '../classes/Fixture';
import { FactoryConstructor, FixtureConstructor, FixtureResult } from '../classes/types';
import { CLASS_IDENTIFIER } from '../decorators/constants';
import { getFactoryIdentifier } from '../decorators/Factory';
import { Type } from '../types';
import Importer, { ImportResult } from './importer';

export interface FixtureRootOptions {
  filePatterns: string[];
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
    this.constructorCache = await new Importer(this.options.filePatterns).import();
    for (const factoryConstructor of this.constructorCache.factories) {
      const name = Reflect.getMetadata(CLASS_IDENTIFIER, factoryConstructor);
      this.factoryInstanceCache[name] = this.instantiateFactory(factoryConstructor);
    }
  }

  public getFactoryInstance<EntityType>(type: Type<EntityType>): BaseFactory<EntityType> | undefined {
    const key = getFactoryIdentifier(type.name);
    if (key in this.factoryInstanceCache) {
      return (this.factoryInstanceCache[key] as BaseFactory<EntityType>);
    }
    return undefined;
  }

  public getFixtureResult<T extends BaseFixture<unknown>>(type: Type<T>): FixtureResult<T> | undefined {
    const key = Reflect.getMetadata(CLASS_IDENTIFIER, type.prototype);
    if (!key) {
      throw new Error(`'${type.name}' is not a valid fixture.`);
    }
    if (key in this.fixtureResultCache) {
      return key as FixtureResult<T>;
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