/**
 * Creates an object that describes how to transform a into b.
 * @param a The old object
 * @param b The new object
 * @returns An object that describes the operations that transform a into b.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const diff = (a: any, b: any): any =>
{
  if (!Object.is(a, b))
  {
    if (a instanceof Array && b instanceof Array)
    {

      const result: any[] = [];

      if (a.length === b.length)
      {
        if (a.every((value, index) =>
          diff(value, b[index]) === undefined))
          return undefined;
      }

      let finalIndices = 0;
      let bOffset = 0;

      for (let index = 0; index < a.length; index++)
      {
        const value = a[index];

        const bIndex = index + bOffset;

        if (b[bIndex] === undefined)
          result.push([ "-", value ]);

        else if (value instanceof Object && b[bIndex] instanceof Object)
        {
          const currentDiff = diff(value, b[bIndex]);
          const nextDiff = diff(value, b[bIndex+1]);

          if (currentDiff !== undefined && nextDiff === undefined)
          {
            result.push([ "+", b[bIndex] ], [ " ", value ]);
            finalIndices += 2;
            bOffset++;
          }

          else if (currentDiff !== undefined)
          {
            result.push([ "~", currentDiff ]);
            finalIndices++;
          }

          else
          {
            result.push([ " ", value ]);
            finalIndices++;
          }
        }

        else if (value !== b[bIndex] && value === b[bIndex+1])
        {
          result.push([ "+", b[bIndex] ], [ " ", value ]);
          finalIndices += 2;
          bOffset++;
        }

        else if (value !== b[bIndex] && value !== b[bIndex+1])
        {
          result.push([ "-", value ], [ "+", b[bIndex] ]);
          finalIndices++;
        }

        else
        {
          result.push([ " ", value ]);
          finalIndices++;
        }
      }

      if (finalIndices < b.length)
      {
        b.slice(a.length).forEach((value) =>
          result.push([ "+", value ]));
      }

      return result;
    }
    else if (a instanceof Object && b instanceof Object)
    {
      const result: any = {};

      Object.entries(b).forEach(([ property, value ]) =>
      {
        if (!(property in a))
          result[`${property}__added`] = value;

        else if (a[property] instanceof Object && value instanceof Object)
        {
          const d = diff(a[property], value);

          if (d !== undefined)
            result[property] = d;
        }

        else if (a[property] !== value)
        {
          result[property] =
          {
            "__old": a[property],
            "__new": value,
          };
        }
      });

      Object.entries(a).forEach(([ property, value ]) =>
      {
        if (!(property in b))
          result[`${property}__deleted`] = value;
      });

      return Object.entries(result).length === 0 ? undefined : result;
    }
    else if (a !== b)
    {
      return {
        "__old": a,
        "__new": b,
      };
    }
  }
  else
    return undefined;
};

/**
 * Creates a list of operations that transform a into b.
 * @param a The old string
 * @param b The new string
 * @returns A diff describing the changes to make a into b.
 */
export const diffText = (a: string, b: string): any =>
{
  if (a === b)
    return undefined;
  else if (a.length === 0)
  {
    return b.split("").map((character, index) =>
      [ "add", index, character ]);
  }
  else if (b.length === 0)
  {
    return a.split("").map(() =>
      [ "delete", 0, undefined ]);
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
const _diffText = (a: string, b: string, isReversed: boolean): any =>
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

  const changeList: [ "add" | "delete", number, string | undefined ][] = [];
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
            "delete",
            index,
            undefined
          ];
        }
        else
        {
          changeList[changeList.length] = [
            "add",
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
            "add",
            index,
            a[x - 1]
          ];

          index++;
        }
        else
        {
          changeList[changeList.length] = [
            "delete",
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
