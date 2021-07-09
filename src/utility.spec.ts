import * as Y from "yjs";
import { arrayToYArray, } from "./utility";

describe("arrayToYArray", () =>
{
  let ydoc: Y.Doc = new Y.Doc();
  let ymap: Y.Map<any> = new Y.Map();

  beforeEach(() =>
  {
    ydoc = new Y.Doc();
    ymap = ydoc.getMap(`tmp`);
  });

  afterEach(() =>
  {
    ydoc.destroy();
  });

  it.each([
    [
      []
    ],
    [
      [ 1 ]
    ],
    [
      [ 1, 2, 3, 4 ]
    ]
  ])("Creates a YArray from %s.", (array: number[]) =>
  {
    ymap.set("array", arrayToYArray(array));
    expect(ymap.get("array").toJSON()).toEqual(array);
  });

  it.each([
    [
      [ [] ], 0
    ],
    [
      [ 1, [ 2, 3 ] ], 1
    ]
  ])(
    "Creates nested YArrays from %s.",
    (array: any[], nestedArrayIndex: number) =>
    {
      ymap.set("array", arrayToYArray(array));

      expect(ymap.get("array").toJSON()).toEqual(array);
      expect((ymap.get("array").get(nestedArrayIndex) as Y.Array<any>).toJSON())
        .toEqual(array[nestedArrayIndex]);
    }
  );
});