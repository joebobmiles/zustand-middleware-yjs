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

      a.forEach((value, index) =>
      {
        if (b[index] === undefined)
          result.push([ "-", value ]);

        else if (value instanceof Object && b[index] instanceof Object)
        {
          const currentDiff = diff(value, b[index]);
          const nextDiff = diff(value, b[index+1]);

          if (currentDiff !== undefined && nextDiff === undefined)
            result.push([ "+", b[index] ], [ " ", value ]);

          else if (currentDiff !== undefined)
            result.push([ "~", currentDiff ]);

          else
            result.push([ " ", value ]);
        }

        else if (value !== b[index] && value === b[index+1])
          result.push([ "+", b[index] ], [ " ", value ]);

        else
          result.push([ " ", value ]);
      });

      if (result.length < a.length)
      {
        a.slice(b.length).forEach((value) =>
          result.push([ "-", value ]));
      }
      else if (result.length < b.length)
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