import { createMapByKey, overwriteProperties } from '..';

class TestClass {
  public t1!: string;
  public t2!: string;
}

describe('overwriteProperties', () => {
  it("doesn't change if overwrite is empty", () => {
    const original = new TestClass();
    original.t1 = '1';
    original.t2 = '2';
    expect(overwriteProperties(original, {})).toMatchObject(original);
  });
  it('works on object', () => {
    const original = { t1: '1', t2: '2' };
    expect(overwriteProperties(original, { t2: '3' })).toMatchObject({ t1: '1', t2: '3' });
  });
  it('works on class', () => {
    const original = new TestClass();
    original.t1 = '1';
    original.t2 = '2';
    expect(overwriteProperties(original, { t2: '3' })).toMatchObject({ t1: '1', t2: '3' });
  });
});

describe('createMapByKey', () => {
  it('works', () => {
    const test = [
      { t1: '1', t2: '2' },
      { t1: '2', t2: '3' },
    ];
    expect(createMapByKey(test, 't1')).toMatchObject({
      '1': { t1: '1', t2: '2' },
      '2': { t1: '2', t2: '3' },
    });
    expect(createMapByKey(test, 't2')).toMatchObject({
      '2': { t1: '1', t2: '2' },
      '3': { t1: '2', t2: '3' },
    });
  });
});
