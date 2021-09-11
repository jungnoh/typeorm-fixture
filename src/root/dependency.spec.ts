import resolveLoadOrder from './dependency';

describe('dependency resolver', () => {
  it('detects referencing self', () => {
    const test = () =>
      resolveLoadOrder([
        { key: 'test1', dependencies: ['test2'] },
        { key: 'test2', dependencies: ['test2'] },
        { key: 'test3', dependencies: [] },
      ]);
    expect(test).toThrow();
  });
});
