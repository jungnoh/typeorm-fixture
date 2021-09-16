import { BaseFactory } from '../..';
import Factory from '../../decorators/Factory';
import { StaticFixture, DynamicFixture } from '../../decorators/Fixture';
import BaseDynamicFixture from '../../classes/DynamicFixture';
import BaseStaticFixture from '../../classes/StaticFixture';

export const SOME_LITERAL = 'hi';
export const SOME_OTHER_LITERAL = 'hi2';

export class TargetEntity {}

@StaticFixture()
export class TestFixture extends BaseStaticFixture<void> {
  public install(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

@DynamicFixture()
export class TestDynamicFixture extends BaseDynamicFixture<void, void> {
  public install(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

@Factory(TargetEntity)
export class TestFactory extends BaseFactory<TargetEntity> {
  protected createRandom(): TargetEntity {
    throw new Error('Method not implemented.');
  }
}
