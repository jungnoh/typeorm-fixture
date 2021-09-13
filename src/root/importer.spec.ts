import { TestFactory, TestFixture } from '../test/importTestTarget/file1';
import Test2 from '../test/importTestTarget/file2';
import Importer from './importer';

describe('importer', () => {
  it('filters exports with decorator', async () => {
    const instance = new Importer(['src/test/importTestTarget/file1.ts']);
    const result = await instance.import();
    expect(result).toMatchObject({
      factories: [TestFactory],
      fixtures: [TestFixture],
    });
  });
  it('works with glob pattern', async () => {
    const instance = new Importer(['src/test/importTestTarget/*.ts']);
    const result = await instance.import();
    expect(result).toMatchObject({
      factories: [TestFactory],
      fixtures: [TestFixture, Test2],
    });
  });
});
