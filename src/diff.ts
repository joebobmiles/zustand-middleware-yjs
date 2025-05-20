import { ChangeType, Change, } from "./types";

type Diffable = Record<string, any> | Array<any> | string;

const isDiffable = (v: any): v is Diffable =>
  isArray(v) || isString(v) || v instanceof Object;

const isArray = (d: Diffable): d is Array<any> =>
  d instanceof Array;

const isString = (d: Diffable): d is string =>
  typeof d === "string";

const isRecord = (d: Diffable): d is Record<string, any> =>
  !isArray(d) && !isString(d);

export const getChanges = (a: Diffable, b: Diffable, atomicProps: Set<string>): Change[] =>
{
  if (isString(a) && isString(b))
    return getStringChanges(a, b);
  else if (isArray(a) && isArray(b))
    return getArrayChanges(a, b, atomicProps);
  else if (isRecord(a) && isRecord(b))
    return getRecordChanges(a, b, atomicProps);
  else
    return [];
};

const getStringChanges = (a: string, b: string): Change[] =>
{
  if (a === b)
    return [];
  else if (a.length === 0)
  {
    return b.split("").map((character, index) =>
      [ ChangeType.INSERT, index, character ]);
  }
  else if (b.length === 0)
  {
    return a.split("").map(() =>
      [ ChangeType.DELETE, 0, undefined ]);
  }
  else if (!hasCommonSubsequence(a, b))
  {
    const deletes = a.split("").map<Change>(() =>
      [ ChangeType.DELETE, 0, undefined ]);

    const inserts = b.split("").map<Change>((character, index) =>
      [ ChangeType.INSERT, index, character ]);

    return deletes.concat(inserts);
  }
  else
  {
    const m = a.length, n = b.length;
    const reverse = m >= n;

    return reverse
      ? _diffText(b, a, reverse)
      : _diffText(a, b, reverse);
  }
};

const getArrayChanges = (a: Array<any>, b: Array<any>, atomicProps: Set<string>): Change[] =>
{
  const changeList: Change[] = [];

  let finalIndices = 0;
  let bOffset = 0;

  for (let index = 0; index < a.length; index++)
  {
    const value = a[index];

    const bIndex = index + bOffset;

    if (b[bIndex] === undefined)
      changeList.push([ ChangeType.DELETE, index, undefined ]);

    else if (isDiffable(value) && isDiffable(b[bIndex]))
    {
      const currentDiff = getChanges(value, b[bIndex], atomicProps);
      const nextDiff = typeof b[bIndex + 1] === "undefined"
        ? []
        : getChanges(value, b[bIndex+1], atomicProps);

      if (typeof b[bIndex+1] !== "undefined" && nextDiff.length === 0)
      {
        changeList.push([ ChangeType.INSERT, index, b[bIndex] ]);
        finalIndices += 2;
        bOffset++;
      }

      else if (currentDiff.length !== 0)
      {
        changeList.push([ ChangeType.PENDING, index, currentDiff ]);
        finalIndices++;
      }

      else
        finalIndices++;
    }

    else if (value !== b[bIndex] && value === b[bIndex+1])
    {
      changeList.push([ ChangeType.INSERT, bIndex, b[bIndex] ]);
      finalIndices += 2;
      bOffset++;
    }

    else if (value !== b[bIndex] && value !== b[bIndex+1])
    {
      changeList.push([ ChangeType.UPDATE, bIndex, b[bIndex] ]);
      finalIndices++;
    }

    else
      finalIndices++;
  }

  if (finalIndices < b.length)
  {
    b.slice(a.length).forEach((value, index) =>
      changeList.push([ ChangeType.INSERT, finalIndices + index, value ]));
  }

  return changeList;
};

const getRecordChanges = (
  a: Record<string, any>,
  b: Record<string, any>,
  atomicProps: Set<string>
): Change[] =>
{
  const changeList: Change[] = [];

  Object.entries(a).forEach(([ property, value ]) =>
  {
    if (!(property in b) && !(value instanceof Function))
      changeList.push([ ChangeType.DELETE, property, undefined ]);
  });

  Object.entries(b).forEach(([ property, value ]) =>
  {
    if (!(property in a))
      changeList.push([ ChangeType.INSERT, property, value ]);

    else if (isDiffable(a[property]) && isDiffable(value) && !atomicProps.has(property))
    {
      const d = getChanges(a[property], value, atomicProps);

      if (d.length !== 0)
        changeList.push([ ChangeType.PENDING, property, d ]);
    }

    else if (a[property] !== value)
      changeList.push([ ChangeType.UPDATE, property, value ]);
  });

  return changeList;
};

const hasCommonSubsequence = (a: string, b: string) =>
{
  const alphabetOfA = a.split("");
  const alphabetOfB = b.split("");

  let hasCommonSubsequence = false;
  for (const c of alphabetOfA)
    hasCommonSubsequence = hasCommonSubsequence || alphabetOfB.includes(c);

  return hasCommonSubsequence;
};

/**
 * An adaptation of Wu et al. O(NP) text diff. (See docs/text-diff)
 *
 * Credit to [this JavaScript implementation](https://github.com/cubicdaiya/onp/blob/master/javascript/onp.js).
 *
 * @param a The old string to transform.
 * @param b The new string to transform to.
 * @param isReversed Whether or not a or b have been swapped.
 * @returns A list of changes that that turn a into b.
 */
const _diffText = (a: string, b: string, isReversed: boolean): Change[] =>
{
  const m = a.length, n = b.length;
  const offset = m;
  const delta = n - m;
  const size = m + n + 1;

  const frontierPoints: number[] = [];
  for (let i = 0; i < size; i++) frontierPoints[i] = -1;

  const path: number[] = [];
  for (let i = 0; i < size; i++) path[i] = -1;

  const pathPositions: { x: number, y: number, k: number }[] = [];

  const snake = (k: number, p: number, q: number) =>
  {
    let y = Math.max(p, q);
    let x = y - k;

    while (x < m && y < n && a[x] === b[y])
    {
      x++; y++;
    }

    path[k + offset] = pathPositions.length;
    pathPositions[pathPositions.length] = {
      "x": x,
      "y": y,
      "k": p > q ? path[k + offset - 1] : path[k + offset + 1],
    };

    return y;
  };

  let p = -1;
  do
  {
    p++;

    for (let k = -p; k < delta; k++)
    {
      frontierPoints[k + offset] = snake(
        k,
        frontierPoints[k + offset - 1] + 1,
        frontierPoints[k + offset + 1]
      );
    }

    for (let k = delta + p; k > delta; k--)
    {
      frontierPoints[k + offset] = snake(
        k,
        frontierPoints[k + offset - 1] + 1,
        frontierPoints[k + offset + 1]
      );
    }

    frontierPoints[delta + offset] = snake(
      delta,
      frontierPoints[delta + offset - 1] + 1,
      frontierPoints[delta + offset + 1]
    );
  } while (frontierPoints[delta + offset] !== n);

  let k = path[delta + offset];

  const editPath: { x: number, y: number }[] = [];
  while (k !== -1)
  {
    editPath[editPath.length] = {
      "x": pathPositions[k].x,
      "y": pathPositions[k].y,
    };

    k = pathPositions[k].k; // eslint-disable-line prefer-destructuring
  }

  const changeList: Change[] = [];
  let x = 0, y = 0, index = -1;

  for (let i = editPath.length - 1; i >= 0; i--)
  {
    while (x <= editPath[i].x || y <= editPath[i].y)
    {
      if (editPath[i].y - editPath[i].x > y - x)
      {
        if (isReversed)
        {
          changeList[changeList.length] = [
            ChangeType.DELETE,
            index,
            undefined
          ];
        }
        else
        {
          changeList[changeList.length] = [
            ChangeType.INSERT,
            index,
            b[y - 1]
          ];

          index++;
        }

        y++;
      }
      else if (editPath[i].y - editPath[i].x < y - x)
      {
        if (isReversed)
        {
          changeList[changeList.length] = [
            ChangeType.INSERT,
            index,
            a[x - 1]
          ];

          index++;
        }
        else
        {
          changeList[changeList.length] = [
            ChangeType.DELETE,
            index,
            undefined
          ];
        }

        x++;
      }
      else
      {
        x++; y++; index++;
      }
    }
  }

  return changeList;
};
