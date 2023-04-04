import * as Y from "yjs";
import {
  arrayToYArray,
  objectToYMap,
  stringToYText,
  yArrayToArray,
  yMapToObject,
  yTextToString,
} from "./mapping";

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

  it("Creates YMaps nested in YArrays from objects nested in arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ { "foo": 1, } ]));

    expect(ymap.get("array").toJSON()).toEqual([ { "foo": 1, } ]);
    expect(ymap.get("array").get(0)
      .get("foo")).toBe(1);
  });
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

    expect(yArrayToArray(ymap.get("array") as Y.Array<any>)).toEqual(array);
  });
});

describe("objectToYMap", () =>
{
  it("Converts an empty object into an empty YMap.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("map", objectToYMap({}));

    expect((ymap.get("map") as Y.Map<any>).toJSON()).toEqual({});
  });

  it("Converts an non-empty object into a YMap with the same entries.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("map", objectToYMap({ "foo": 1, }));

    expect((ymap.get("map") as Y.Map<any>).toJSON()).toEqual({ "foo": 1, });
  });

  it("Converts nested objects into nested YMaps.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("map", objectToYMap({ "foo": { "bar": 2, }, }));

    expect((ymap.get("map") as Y.Map<any>).toJSON())
      .toEqual({ "foo": { "bar": 2, }, });
    expect((ymap.get("map") as Y.Map<any>).get("foo").get("bar")).toBe(2);
  });

  it("Converts nested arrays into nested YArrays.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("map", objectToYMap({ "foo": [ 1, 2 ], }));

    expect((ymap.get("map") as Y.Map<any>).toJSON())
      .toEqual({ "foo": [ 1, 2 ], });
    expect((ymap.get("map") as Y.Map<any>).get("foo").get(0)).toBe(1);
    expect((ymap.get("map") as Y.Map<any>).get("foo").get(1)).toBe(2);
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
    (ymap.get("foo") as Y.Map<any>).set("bar", 2);

    expect(yMapToObject(ymap)).toEqual({ "foo": { "bar": 2, }, });
  });
});

describe("objectToYMap and yMapToObject are inverses", () =>
{
  it.each([
    [
      {}
    ],
    [
      { "foo": 1, }
    ],
    [
      { "foo": { "bar": 2, }, }
    ]
  ])("Converts objects back into their original forms. (#%#)", (object) =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("map", objectToYMap(object));

    expect(yMapToObject(ymap.get("map") as Y.Map<any>)).toEqual(object);
  });
});

describe("yTextToString", () =>
{
  it.each([
    "hello",
    "rawr",
    "goodbye"
  ])("Returns a string with the same content as the YText.", (string) =>
  {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("tmp");

    ytext.insert(0, string);

    expect(yTextToString(ytext)).toEqual(string);
  });
});

describe("stringToYText", () =>
{
  it.each([
    "hello",
    "goodbye",
    "wrong",
    "running out of things to type"
  ])("Returns a YText with the same content as the string", (string) =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("text", stringToYText(string));

    expect((ymap.get("text") as Y.Text).toString()).toEqual(string);
  });
});