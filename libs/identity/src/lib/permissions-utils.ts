import { TransactionSpendingLimitResponse } from 'deso-protocol-types';
import { TransactionSpendingLimitResponseOptions } from './types';

export function compareTransactionSpendingLimits(
  expectedPermissions: any,
  actualPermissions: any
): boolean {
  let hasAllPermissions = true;

  // if the key is unlimited then we don't need to check anything else
  if (actualPermissions?.IsUnlimited) {
    return hasAllPermissions;
  }

  walkObj(expectedPermissions, (expectedVal, path) => {
    const actualVal = getDeepValue(actualPermissions, path);
    if (
      typeof actualVal === 'undefined' ||
      (typeof actualVal === 'number' &&
        typeof expectedVal === 'number' &&
        actualVal < expectedVal) ||
      (typeof actualVal === 'number' &&
        expectedVal === 'UNLIMITED' &&
        actualVal < 1e9)
    ) {
      hasAllPermissions = false;
    }
  });

  return hasAllPermissions;
}

export function buildTransactionSpendingLimitResponse(
  spendingLimitOptions: Partial<TransactionSpendingLimitResponseOptions>
): TransactionSpendingLimitResponse {
  if (spendingLimitOptions?.IsUnlimited) {
    return {
      IsUnlimited: true,
    };
  }

  const result: TransactionSpendingLimitResponse = {};

  walkObj(
    spendingLimitOptions,
    (val, path) => {
      setDeepValue(result, path, val === 'UNLIMITED' ? 1e9 : val);
    },
    []
  );

  if (
    !result.TransactionCountLimitMap ||
    typeof result.TransactionCountLimitMap?.['AUTHORIZE_DERIVED_KEY'] ===
      'undefined'
  ) {
    result.TransactionCountLimitMap = {
      ...result.TransactionCountLimitMap,
      AUTHORIZE_DERIVED_KEY: 1,
    };
  }

  return result;
}

function walkObj(
  node: any,
  callback: (val: any, path: string[]) => void,
  path: string[] = []
) {
  if (typeof node === 'object' && node !== null) {
    const keys = Object.keys(node);
    for (let i = 0; i < keys.length; i++) {
      walkObj(node[keys[i]], callback, path.concat(keys[i]));
    }
  } else {
    callback(node, path);
  }
}

function getDeepValue(obj: any, path: string[]): any {
  const currKey = path[0];

  if (
    obj === null ||
    typeof obj !== 'object' ||
    typeof obj[currKey] === 'undefined'
  ) {
    return;
  }

  if (path.length === 1) {
    return obj[currKey];
  } else {
    return getDeepValue(obj[currKey], path.slice(1));
  }
}

function setDeepValue(obj: any, path: string[], value: any) {
  const currKey = path[0];

  if (typeof obj[currKey] === 'undefined') {
    obj[currKey] = {};
  }

  if (path.length === 1) {
    obj[currKey] = value;
  } else {
    setDeepValue(obj[currKey], path.slice(1), value);
  }
}
