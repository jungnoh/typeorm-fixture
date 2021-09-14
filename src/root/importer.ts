/* eslint-disable @typescript-eslint/ban-types */
import glob from 'glob';
import { resolve as resolvePath } from 'path';
import {
  DynamicFixtureConstructor,
  FactoryConstructor,
  FixtureConstructor,
  StaticFixtureConstructor,
} from '../classes/types';
import { FACTORY_MARK, FIXTURE_MARK, FIXTURE_TYPE } from '../decorators/constants';
import { FixtureType } from '../decorators/identifiers';

const globPromise = (pattern: string) =>
  new Promise<string[]>((res, rej) => {
    glob(pattern, (err, matches) => {
      if (err) rej(err);
      res(matches);
    });
  });

export interface ImportResult {
  factories: FactoryConstructor[];
  staticFixtures: StaticFixtureConstructor[];
  dynamicFixtures: DynamicFixtureConstructor[];
}

export function sortConstructors(items: (FactoryConstructor | FixtureConstructor)[]): ImportResult {
  const result: ImportResult = {
    factories: [],
    staticFixtures: [],
    dynamicFixtures: [],
  };
  items.forEach((item) => {
    const funcPrototype = (item as Function).prototype;
    if (Reflect.hasMetadata(FACTORY_MARK, funcPrototype)) {
      result.factories.push(item as FactoryConstructor);
    }
    if (Reflect.hasMetadata(FIXTURE_MARK, funcPrototype)) {
      const fixtureType = Reflect.getMetadata(FIXTURE_TYPE, funcPrototype);
      if (fixtureType === FixtureType.DYNAMIC) {
        result.dynamicFixtures.push(item as DynamicFixtureConstructor);
      } else {
        result.staticFixtures.push(item as StaticFixtureConstructor);
      }
    }
  });
  return result;
}

export default class Importer {
  constructor(private readonly glob: string[]) {}

  public async import(): Promise<ImportResult> {
    const files = await this.matchGlob();
    const imported = await Promise.all(files.map((file) => this.importFile(file)));
    return {
      factories: imported.map((v) => v.factories).flat(),
      staticFixtures: imported.map((v) => v.staticFixtures).flat(),
      dynamicFixtures: imported.map((v) => v.dynamicFixtures).flat(),
    };
  }

  private async importFile(path: string): Promise<ImportResult> {
    const exports: Record<string, unknown> = await import(path);
    return sortConstructors(
      Object.values(exports).filter((v) => typeof v === 'function') as (
        | FactoryConstructor
        | FixtureConstructor
      )[]
    );
  }

  private async matchGlob(): Promise<string[]> {
    const globPromises = this.glob.map((pattern) =>
      globPromise(resolvePath(process.cwd(), pattern))
    );
    return (await Promise.all(globPromises)).flat();
  }
}
