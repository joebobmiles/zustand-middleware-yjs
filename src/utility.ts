import * as Y from "yjs";

export const arrayToYArray = (array: any[]): Y.Array<any> =>
{
  const yarray = new Y.Array();

  array.forEach((value) =>
  {
    if (value instanceof Array)
      yarray.push([ arrayToYArray(value) ]);

    else
      yarray.push([ value ]);
  });

  return yarray;
};