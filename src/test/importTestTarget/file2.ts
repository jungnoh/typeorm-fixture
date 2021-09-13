import BaseFixture from '../../classes/BaseFixture';
import Fixture from '../../decorators/Fixture';

@Fixture()
export default class Test2 extends BaseFixture<string> {
  public install(): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
