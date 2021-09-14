import BaseStaticFixture from '../../classes/StaticFixture';
import { StaticFixture } from '../../decorators/Fixture';

@StaticFixture()
export default class Test2 extends BaseStaticFixture<string> {
  public install(): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
