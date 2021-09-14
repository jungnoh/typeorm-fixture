interface DependencyNode {
  key: string;
  dependents: string[];
}

interface DependencySortNode extends DependencyNode {
  check?: 'parent' | 'done';
}

interface DependencySortInput {
  key: string;
  dependencies: string[];
}

interface DependencyConstraints {
  traversalRoots?: string[];
  traversalNodes?: string[];
}

function sort(input: DependencyNode[], constraints?: DependencyConstraints): string[] {
  const keyMap: Record<string, DependencySortNode> = input.reduce(
    (prev, now) => ({ ...prev, [now.key]: now }),
    {}
  );
  let result: string[] = [];

  const node = (key: string): boolean => {
    let rootFound = !constraints?.traversalRoots || constraints.traversalRoots.includes(key);
    if (constraints?.traversalNodes && constraints.traversalNodes.includes(key)) {
      throw new Error(`Node ${key} was not allowed but in the dependency tree.`);
    }
    if (keyMap[key].check === 'done') {
      return rootFound;
    }
    if (keyMap[key].check === 'parent') {
      throw new Error(`Circular dependency from '${key}' detected!`);
    }
    keyMap[key].check = 'parent';
    for (const item of keyMap[key].dependents) {
      const childNodeFound = node(item);
      rootFound = rootFound || childNodeFound;
    }
    keyMap[key].check = 'done';
    if (rootFound) {
      result = [key, ...result];
    }
    return rootFound;
  };
  for (const key of Object.keys(keyMap)) {
    if (!keyMap[key].check) {
      node(key);
    }
  }
  return result;
}

function buildDependentMap(input: DependencySortInput[]): DependencyNode[] {
  const ret: Record<string, DependencyNode & { check: boolean }> = {};

  for (const item of input) {
    if (item.key in ret) {
      if (ret[item.key].check) {
        throw new Error(`Duplicate key '${item.key}'`);
      }
      ret[item.key].check = true;
    } else {
      ret[item.key] = {
        key: item.key,
        dependents: [],
        check: true,
      };
    }
    for (const parent of item.dependencies) {
      if (parent === item.key) {
        throw new Error(`'${item.key}' references itself`);
      }
      if (!(parent in ret)) {
        ret[parent] = {
          key: parent,
          dependents: [],
          check: false,
        };
      }
      ret[parent].dependents.push(item.key);
    }
  }

  const unmatchedKeys = Object.values(ret)
    .filter((item) => !item.check)
    .map((item) => item.key);
  if (unmatchedKeys.length > 0) {
    throw new Error(`Some keys are dependencies but not given: '${unmatchedKeys}'`);
  }

  return Object.values(ret).map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { check, ...rest } = item;
    return rest;
  });
}

export default function resolveLoadOrder(
  input: DependencySortInput[],
  constraints?: DependencyConstraints
): string[] {
  return sort(buildDependentMap(input), constraints);
}
