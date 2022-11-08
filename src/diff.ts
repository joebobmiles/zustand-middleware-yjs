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

export const diffText = (a: string, b: string): any =>
{
  if (a === b)
    return undefined;
  else if (a.length === 0)
  {
    return [
      [ "add", 0, b ]
    ];
  }
  else if (b.length === 0)
  {
    return [
      [ "delete", 0, undefined ]
    ];
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

const _diffText = (a: string, b: string, isReversed: boolean): any =>
{
  const m = a.length, n = b.length;
  const offset = m;
  const delta = n - m;

  const frontierPoints: number[] = [];
  for (let i = 0; i < m + n + 1; i++) frontierPoints[i] = -1;

  const path: number[] = [];
  for (let i = 0; i < m + n + 1; i++) path[i] = -1;

  const pathPositions: { x: number, y: number, k: number }[] = [];

  const snake = (k: number, p: number, q: number) =>
  {
    let y = Math.max(p, q);
    let x = y - k;

    while (x < m && y < n && a[x + 1] === b[y + 1])
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
  let x = 0, y = 0;

  for (let i = editPath.length - 1; i >= 0; i--)
  {
    while (x <= editPath[i].x || y <= editPath[i].y)
    {
      if (editPath[i].y - editPath[i].x > y - x)
      {
        changeList[changeList.length] = [
          isReversed ? "delete" : "add",
          y,
          isReversed ? undefined : b[y]
        ];

        y++;
      }
      else if (editPath[i].y - editPath[i].x < y - x)
      {
        changeList[changeList.length] = [
          isReversed ? "add" : "delete",
          x,
          isReversed ? a[x] : undefined
        ];

        x++;
      }
      else
      {
        x++; y++;
      }
    }
  }

  return changeList;
};
