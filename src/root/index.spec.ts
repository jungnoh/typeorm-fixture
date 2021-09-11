import FixtureRoot from '.';
import BaseFactory from '../classes/BaseFactory';
import Factory from '../decorators/Factory';
import Importer from './importer';

class TargetEntity {}

@Factory(TargetEntity)
class TestFactory extends BaseFactory<TargetEntity> {
  public random(): TargetEntity {
    throw new Error('Method not implemented.');
  }
}

describe('FixtureRoot', () => {
  describe('loadFiles', () => {
    it('loads', async () => {
      jest.spyOn(Importer.prototype, 'import').mockImplementation(async () => {
        return {
          factories: [TestFactory],
          fixtures: [],
        };
      });
      const instance = new FixtureRoot({ filePatterns: [] });
      await instance.loadFiles();
      expect(instance.getFactoryInstance(TargetEntity)).toBeInstanceOf(TestFactory);
    });
    it("doesn't run if constructors are cached", async () => {
      const importMock = jest.fn(async () => {
        return {
          factories: [],
          fixtures: [],
        };
      });
      jest.spyOn(Importer.prototype, 'import').mockImplementation(importMock);
      const instance = new FixtureRoot({ filePatterns: [] });
      await instance.loadFiles();
      await instance.loadFiles();
      expect(importMock).toBeCalledTimes(1);
    });
  });
  describe('installFixtures', () => {
    it('throws if not loaded', async () => {
      const instance = new FixtureRoot({ filePatterns: [] });
      await expect(instance.installFixtures()).rejects.toThrowError();
    });
  });
});
