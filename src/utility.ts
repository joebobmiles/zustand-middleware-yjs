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

export const yArrayToArray = (yarray: Y.Array<any>): any[] =>
  yarray.toJSON();

export const objectToYMap = (object: any): Y.Map<any> =>
{
  const ymap = new Y.Map();

  Object.entries(object).forEach(([ property, value ]) =>
  {
    if (value instanceof Object)
      ymap.set(property, objectToYMap(value));

    else
      ymap.set(property, value);
  });

  return ymap;
};