/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'crypto';
import 'reflect-metadata';
import { BaseFactory, Factory } from '..';
import { FactoryBridge } from '../root/bridge';

class TargetEntity {
  public t1!: string;
  public t2!: string;
}

class SmallEntity {
  public t1!: string;
}

@Factory(TargetEntity)
class TestFactory extends BaseFactory<TargetEntity> {
  protected createRandom(): TargetEntity {
    throw new Error('Method not implemented.');
  }
}

@Factory(TargetEntity)
class TestFactoryOfFactory extends BaseFactory<TargetEntity> {
  protected createRandom() {
    return {
      ...this.factoryOf(SmallEntity).random(),
      t2: 'success',
    };
  }
}

@Factory(TargetEntity)
class TestPartialMapFactory extends BaseFactory<TargetEntity> {
  protected createRandom() {
    return {
      t1: randomUUID(),
      t2: randomUUID(),
    };
  }
}

describe('BaseFactory', () => {
  it('randomMany', () => {
    const mockedBridge = {
      getFactoryInstance: jest.fn(),
    };
    const factory = new TestFactory(mockedBridge);
    const randomMock = jest.fn(() => new TargetEntity());
    jest.spyOn(factory, 'random').mockImplementation(randomMock);
    const result = factory.randomMany(12);
    expect(randomMock).toBeCalledTimes(12);
    expect(result).toHaveLength(12);
  });
  it('partial', () => {
    const mockedBridge = {
      getFactoryInstance: jest.fn(),
    };
    const factory = new TestFactory(mockedBridge);
    const randomMock = jest.fn(() => new TargetEntity());
    jest.spyOn(factory, 'createRandom' as any).mockImplementation(randomMock);
    const result = factory.partial({ t2: 'asdf' });
    expect(result.t2).toEqual('asdf');
  });
  it('partialMany', () => {
    const mockedBridge = {
      getFactoryInstance: jest.fn(),
    };
    const factory = new TestFactory(mockedBridge);
    const randomMock = jest.fn(() => new TargetEntity());
    jest.spyOn(factory, 'createRandom' as any).mockImplementation(randomMock);
    const result = factory.partialMany(12, { t2: 'asdf' });
    expect(randomMock).toBeCalledTimes(12);
    expect(result).toHaveLength(12);
    expect(result.every((v) => v.t2 === 'asdf')).toBe(true);
  });
  it('partialMap', () => {
    const mockedBridge = {
      getFactoryInstance: jest.fn(),
    };
    const factory = new TestPartialMapFactory(mockedBridge);
    const partial = [1, 2, 3, 4, 5].map((v) => ({
      t1: v.toString(),
    }));
    const result = factory.partialMap(partial);
    expect(result).toHaveLength(5);
    for (let i = 0; i < partial.length - 1; i += 1) {
      expect(result[i].t2).not.toEqual(result[i + 1].t2);
    }
  });
  describe('factoryOf', () => {
    it('works', () => {
      const mockedBridge = {
        getFactoryInstance: jest.fn(() => ({
          random: () => ({ t1: 'hi' }),
        })),
      };
      const factory = new TestFactoryOfFactory(mockedBridge as unknown as FactoryBridge);
      expect(factory.random()).toMatchObject({
        t1: 'hi',
        t2: 'success',
      });
    });
    it('throws if getFactoryInstance returns undefined', () => {
      const mockedBridge = {
        getFactoryInstance: jest.fn(() => undefined),
      };
      const factory = new TestFactoryOfFactory(mockedBridge as unknown as FactoryBridge);
      expect(() => factory.random()).toThrowError();
    });
  });
});
