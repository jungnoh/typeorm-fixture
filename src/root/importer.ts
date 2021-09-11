/* eslint-disable @typescript-eslint/ban-types */
import glob from 'glob';
import { resolve as resolvePath } from 'path';
import { FactoryConstructor, FixtureConstructor } from '../classes/types';
import { FACTORY_MARK, FIXTURE_MARK } from '../decorators/constants';

const globPromise = (pattern: string) =>
  new Promise<string[]>((res, rej) => {
    glob(pattern, (err, matches) => {
      if (err) rej(err);
      res(matches);
    });
  });

export interface ImportResult {
  factories: FactoryConstructor[];
  fixtures: FixtureConstructor[];
}

export default class Importer {
  constructor(private readonly glob: string[]) {}

  public async import(): Promise<ImportResult> {
    const files = await this.matchGlob();
    const imported = await Promise.all(
      files.map((file) => this.importFile(file))
    );
    return {
      factories: imported.map((v) => v.factories).flat(),
      fixtures: imported.map((v) => v.fixtures).flat(),
    };
  }

  private async importFile(path: string): Promise<ImportResult> {
    const exports: Record<string, unknown> = await import(path);
    const result: ImportResult = {
      factories: [],
      fixtures: [],
    };
    for (const key of Object.keys(exports)) {
      if (!(typeof exports[key] === 'function')) {
        continue;
      }
      if (
        Reflect.hasMetadata(FACTORY_MARK, (exports[key] as Function).prototype)
      ) {
        result.factories.push(exports[key] as FactoryConstructor);
      }
      if (
        Reflect.hasMetadata(FIXTURE_MARK, (exports[key] as Function).prototype)
      ) {
        result.fixtures.push(exports[key] as FixtureConstructor);
      }
    }
    return result;
  }

  private async matchGlob(): Promise<string[]> {
    const globPromises = this.glob.map((pattern) =>
      globPromise(resolvePath(process.cwd(), pattern))
    );
    return (await Promise.all(globPromises)).flat();
  }
}
