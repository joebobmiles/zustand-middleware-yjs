import * as Y from "yjs";

export const arrayToYArray = (array: any[]): Y.Array<any> =>
{
  const yarray = new Y.Array();

  array.forEach((value) =>
    yarray.push([ value ]));

  return yarray;
};