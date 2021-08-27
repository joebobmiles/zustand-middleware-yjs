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
        if (a[property] === undefined)
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
        if (b[property] === undefined)
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