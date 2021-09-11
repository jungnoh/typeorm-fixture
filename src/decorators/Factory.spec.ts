import 'reflect-metadata';
import { BaseFactory } from '..';
import { FactoryBridge } from '../root/bridge';
import { CLASS_IDENTIFIER, FACTORY_MARK, FACTORY_TARGET, MARK_VALUE } from './constants';
import Factory from './Factory';

class TargetEntity {}

@Factory(TargetEntity)
class TestFactory extends BaseFactory<TargetEntity> {
  public random(): TargetEntity {
    throw new Error('Method not implemented.');
  }
}

@Factory(TargetEntity)
class WronglyImplementedTestFactory {}

describe('@Factory', () => {
  it('marks class as factory', () => {
    expect(Reflect.hasMetadata(FACTORY_MARK, TestFactory.prototype)).toBeTruthy();
    expect(Reflect.getMetadata(FACTORY_MARK, TestFactory.prototype)).toEqual(MARK_VALUE);
  });
  it('sets class identifier by target name', () => {
    expect(Reflect.getMetadata(CLASS_IDENTIFIER, TestFactory.prototype) as string).toContain(TargetEntity.name);
  });
  it('stores target entity as metadata', () => {
    expect(Reflect.getMetadata(FACTORY_TARGET, TestFactory.prototype)).toEqual(TargetEntity);
  });
  it('throws error in constructor if class does not extend BaseFactory', () => {
    const mockedBridge: FactoryBridge = {
      getFactoryInstance: jest.fn(),
    };
    expect(() => new TestFactory(mockedBridge)).not.toThrow();
    expect(() => new WronglyImplementedTestFactory()).toThrow();
  })
});
