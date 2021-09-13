import resolveLoadOrder from './dependency';

describe('dependency resolver', () => {
  it('detects referencing self', () => {
    const test = () =>
      resolveLoadOrder([
        { key: 'test1', dependencies: ['test2'] },
        { key: 'test2', dependencies: ['test2'] },
        { key: 'test3', dependencies: [] },
      ]);
    expect(test).toThrowError();
  });

  it('detects circular dependency', () => {
    const smallTest = () => {
      resolveLoadOrder([
        { key: 'test1', dependencies: ['test2'] },
        { key: 'test2', dependencies: ['test1'] },
      ]);
    };
    expect(smallTest).toThrowError();

    const largerTest = () => {
      resolveLoadOrder([
        { key: 'test5', dependencies: ['test4'] },
        { key: 'test4', dependencies: ['test3'] },
        { key: 'test1', dependencies: ['test2'] },
        { key: 'test2', dependencies: ['test3'] },
        { key: 'test3', dependencies: ['test1'] },
      ]);
    };
    expect(largerTest).toThrowError();
  });

  it('throws when dependency does not exist', () => {
    const test = () =>
      resolveLoadOrder([
        { key: 'test1', dependencies: ['test2'] },
        { key: 'test2', dependencies: ['test3'] },
      ]);
    expect(test).toThrowError();
  });

  it('correctly resolves dependencies', () => {
    const testCase = [
      { key: '1', dependencies: [] },
      { key: '2', dependencies: ['1'] },
      { key: '3', dependencies: ['1'] },
      { key: '4', dependencies: ['1', '7'] },
      { key: '5', dependencies: ['2', '3'] },
      { key: '6', dependencies: ['3'] },
      { key: '7', dependencies: ['6'] },
    ];
    const result = resolveLoadOrder(testCase);
    for (const item of testCase) {
      for (const dep of item.dependencies) {
        expect(result.indexOf(item.key)).toBeGreaterThan(result.indexOf(dep));
      }
    }
    expect(result.sort()).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('throws if duplicate key exists', () => {
    const test = () =>
      resolveLoadOrder([
        { key: '1', dependencies: [] },
        { key: '1', dependencies: [] },
      ]);
    expect(test).toThrowError();
  });

  it('checks traversalNodes constraint', () => {
    const tree = [
      { key: 'test1', dependencies: ['test2'] },
      { key: 'test2', dependencies: ['test3'] },
      { key: 'test3', dependencies: [] },
    ];
    const nodeTest = () =>
      resolveLoadOrder(tree, {
        traversalNodes: ['test1', 'test2'],
      });
    expect(nodeTest).toThrowError();

    const fullNodeTest = () =>
      resolveLoadOrder(tree, {
        traversalNodes: ['test1', 'test2', 'test3'],
      });
    expect(fullNodeTest).toThrowError();

    const rootTest = () =>
      resolveLoadOrder(tree, {
        traversalRoots: ['test2'],
      });
    expect(rootTest).not.toThrowError();
    expect(rootTest()).toEqual(['test3', 'test2']);
  });
});
