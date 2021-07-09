import * as Y from "yjs";
import { arrayToYArray, objectToYMap, yArrayToArray, yMapToObject, } from "./utility";

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
  ])("Creates a YArray from %s.", (array) =>
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
    (array, nestedArrayIndex) =>
    {
      ymap.set("array", arrayToYArray(array));

      expect(ymap.get("array").toJSON()).toEqual(array);
      expect((ymap.get("array").get(nestedArrayIndex) as Y.Array<any>).toJSON())
        .toEqual(array[nestedArrayIndex]);
    }
  );
});

describe("yArrayToArray", () =>
{
  it.each([
    [
      []
    ],
    [
      [ 1 ]
    ],
    [
      [ 1, 2, 3, 4 ]
    ],
    [
      [ [] ]
    ],
    [
      [ 1, [ 2, 3 ] ]
    ]
  ])("Converts a YArray of %s to an array", (array) =>
  {
    const ydoc = new Y.Doc();
    const yarray = ydoc.getArray("test");

    yarray.push(array);

    expect(yArrayToArray(yarray)).toEqual(array);
  });
});

describe("arrayToYArray and yArrayToArray are inverses", () =>
{
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
  ])("Converts arrays back into their original form. (#%#)", (array) =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("array", arrayToYArray(array));

    expect(yArrayToArray(ymap.get("array"))).toEqual(array);
  });
});

describe("objectToYMap", () =>
{
  it("Converts an empty object into an empty YMap.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("map", objectToYMap({}));

    expect(ymap.get("map").toJSON()).toEqual({});
  });

  it("Converts an non-empty object into a YMap with the same entries.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("map", objectToYMap({ "foo": 1, }));

    expect(ymap.get("map").toJSON()).toEqual({ "foo": 1, });
  });

  it("Converts nested objects into nested YMaps.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("map", objectToYMap({ "foo": { "bar": 2, }, }));

    expect(ymap.get("map").toJSON()).toEqual({ "foo": { "bar": 2, }, });
    expect(ymap.get("map").get("foo")
      .get("bar"))
      .toBe(2);
  });
});

describe("yMapToObject", () =>
{
  it("Converts an empty YMap to an empty object.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    expect(yMapToObject(ymap)).toEqual({});
  });

  it("Converts a non-empty YMap to a non-empty object.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("foo", 1);

    expect(yMapToObject(ymap)).toEqual({ "foo": 1, });
  });

  it("Converts nested YMaps to nested objects.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("foo", new Y.Map());
    ymap.get("foo").set("bar", 2);

    expect(yMapToObject(ymap)).toEqual({ "foo": { "bar": 2, }, });
  });
});