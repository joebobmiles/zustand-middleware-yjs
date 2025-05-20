import * as Y from "yjs";

/**
 * Converts a normal JavaScript array to a YArray shared type. Any nested
 * objects or arrays are turned into YMaps and YArrays, respectively.
 *
 * @example <caption>Single-level array to YArray.</caption>
 * arrayToYArray([ 1, 2, 3, 4 ]).get(0) // => 1
 *
 * @example <caption>Nested arrays to nested YArrays.</caption>
 * arrayToYArray([ 1, [ 2, 3 ] ]).get(1).get(0) // => 2
 *
 * @example <caption>Object nested inside array to YMap nested in YArray.</caption>
 * arrayToYArray([ { foo: 1 } ]).get(0).get("foo") // => 1
 *
 * @param array The array to transform into a YArray
 * @param atomicProps
 * @returns A YArray.
 */
export const arrayToYArray = (array: any[], atomicProps: Set<string>): Y.Array<any> =>
{
  const yarray = new Y.Array();

  array.forEach((value) =>
  {
    if (value instanceof Array)
      yarray.push([ arrayToYArray(value, atomicProps) ]);

    else if (value instanceof Object)
      yarray.push([ objectToYMap(value, atomicProps) ]);

    else if (typeof value === "string")
      yarray.push([ stringToYText(value) ]);

    else
      yarray.push([ value ]);
  });

  return yarray;
};

/**
 * Converts a YArray to a normal JavaScript array. Any shared types in the
 * array are converted to their traditional types (i.e. YMaps are converted to
 * objects; YArrays are converted to arrays).
 *
 * @example <caption>Single-level YArray to array.</caption>
 * const yarray = (new Y.Doc()).getArray("array");
 * yarray.push([ 1, 2, 3, 4 ]);
 *
 * yArrayToArray(yarray) // => [ 1, 2, 3, 4 ]
 *
 * @example <caption>Nested YArrays to nested arrays.</caption>
 * const ydoc = new Y.Doc();
 *
 * const yarray1 = ydoc.getArray("array");
 * const yarray2 = new Y.Array();
 *
 * yarray2.push([ 2, 3 ])
 * yarray1.push([ 1, yarray2, 4 ]);
 *
 * yArrayToArray(yarray1) // => [ 1, [ 2, 3 ], 4 ]
 *
 * @example <caption>Nested YMaps in YArrays are converted to objects nested in arrays.</caption>
 * const ydoc = new Y.Doc();
 *
 * const yarray = ydoc.getArray("array");
 * const ymap = new Y.Map();
 *
 * ymap.set("foo", 1)
 * yarray.push([ ymap ]);
 *
 * yArrayToArray(yarray) // => [ { foo: 1 } ]
 *
 * @param yarray The YArray to convert to a plain array.
 * @returns A plain JavaScript array.
 */
export const yArrayToArray = (yarray: Y.Array<any>): any[] =>
  yarray.toJSON();

/**
 * Converts a normal JavaScript object into a YMap shared type. Any nested
 * objects or arrays are turned into YMaps or YArrays, respectively.
 *
 * @example <caption>Single-level object to YMap.</caption>
 * objectToYMap({ foo: 1, bar: 2 }).get("foo") // => 1
 *
 * @example <caption>Nested objects to nested YMaps.</caption>
 * objectToYMap({ foo: { bar: 1 } }).get("foo").get("bar") // => 1
 *
 * @example <caption>Nested arrays in objects to nested YArrays in YMaps. </caption>
 * objectToYMap({ foo: [ 1, 2 ] }).get("foo").get(1) // => 2
 *
 * @param object The object to turn into a YMap shared type.
 * @param atomicProps
 * @returns A YMap.
 */
export const objectToYMap = (object: any, atomicProps: Set<string>): Y.Map<any> =>
{
  const ymap = new Y.Map();

  Object.entries(object).forEach(([ property, value ]) =>
  {
    if (atomicProps.has(property))
      ymap.set(property, value);

    else if (value instanceof Array)
      ymap.set(property, arrayToYArray(value, atomicProps));

    else if (value instanceof Object)
      ymap.set(property, objectToYMap(value, atomicProps));

    else if (typeof value === "string")
      ymap.set(property, stringToYText(value));

    else
      ymap.set(property, value);
  });

  return ymap;
};

/**
 * Converts a YMap to a normal JavaScript object. Any nested shared types are
 * converted to their JavaScript equivalents (i.e YMaps are converted to
 * objects; YArrays are converted to arrays).
 *
 * @example <caption>Single-level object to YMap.</caption>
 * const ymap = (new Y.Doc()).getMap("map");
 * ymap.set("foo", 1);
 *
 * yMapToObject(ymap) // => { foo: 1 }
 *
 * @example <caption>Nested objects to nested YMaps.</caption>
 * const ydoc = new Y.Doc();
 *
 * const ymap1 = ydoc.getMap("map");
 * const ymap2 = new Y.Map();
 *
 * ymap2.set("bar", 1)
 * ymap1.push("foo", ymap2);
 *
 * yMapToObject(ymap1) // => { foo: { bar: 1 } }
 *
 * @example <caption>Nested arrays in objects are converted to YArrays nested in YMaps.</caption>
 * const ydoc = new Y.Doc();
 *
 * const ymap = ydoc.getMap("map");
 * const yarray = new Y.Array();
 *
 * yarray.push([ 1, 2 ]);
 * ymap.set("foo", yarray)
 *
 * yArrayToArray(yarray) // => { foo: [ 1, 2 ] }
 *
 * @param ymap YMap to convert to a plain JavaScript object.
 * @returns A plain JavaScript object.
 */
export const yMapToObject = (ymap: Y.Map<any>): any =>
  ymap.toJSON();

export const yTextToString = (ytext: Y.Text): string =>
  ytext.toString();

export const stringToYText = (string: string): Y.Text =>
  new Y.Text(string);
