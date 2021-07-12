import * as Y from "yjs";
import { arrayToYArray, objectToYMap, } from "./mapping";
import { getChangeList, patchSharedType, } from "./patching";

describe("getChangeList", () =>
{
  it(
    "Should create an empty array for two values that are identical.",
    () =>
    {
      expect(getChangeList({}, {})).toEqual([]);
    }
  );

  it.each([
    [
      {},
      { "foo": 1, },
      [ "add", "foo", 1 ]
    ],
    [
      [],
      [ 1 ],
      [ "add", 0, 1 ]
    ]
  ])(
    "Should create an add entry when b contains a new item. (#%#)",
    (a, b, change) =>
    {
      expect(getChangeList(a, b)).toEqual([ change ]);
    }
  );

  it("Should create an update entry when b contains a new value.", () =>
  {
    expect(getChangeList( { "foo": 1, }, { "foo": 2, }))
      .toEqual([ [ "update", "foo", 2 ] ]);
  });

  it("Should create an add and delete entry when an array changes.", () =>
  {
    expect(getChangeList( [ 1 ], [ 2 ]))
      .toEqual([ [ "delete", 0, undefined ], [ "add", 0, 2 ] ]);
  });

  it(
    "Should create a delete entry when b is missing a value.",
    () =>
    {
      expect(getChangeList({ "foo": 1, }, {}))
        .toEqual([ [ "delete", "foo", undefined ] ]);
    }
  );

  it.each([
    [
      { "foo": { "bar": 1, }, },
      { "foo": { "bar": 2, }, },
      [ "pending", "foo", undefined ]
    ],
    [
      { "foo": [ 1 ], },
      { "foo": [ 1, 2 ], },
      [ "pending", "foo", undefined ]
    ],
    [
      [ { "foo": 1, "bar": 3, } ],
      [ { "foo": 2, "bar": 3, } ],
      [ "pending", 0, undefined ]
    ]
  ])(
    "Should create a pending entry when a and b have nested data. (#%#)",
    (a, b, change) =>
    {
      expect(getChangeList(a, b))
        .toEqual([ change ]);
    }
  );
});

describe("patchSharedType", () =>
{
  let ydoc: Y.Doc = new Y.Doc();
  let ymap: Y.Map<any> = new Y.Map();

  beforeEach(() =>
  {
    ydoc = new Y.Doc();
    ymap = ydoc.getMap("tmp");
  });

  afterEach(() =>
  {
    ydoc.destroy();
  });

  it("Applies additions to maps.", () =>
  {
    ymap.set("state", objectToYMap({ }));
    patchSharedType(ymap.get("state"), { "foo": 1, });

    expect(ymap.get("state").get("foo")).toBe(1);
  });

  it("Applies updates to maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": 1, }));
    patchSharedType(ymap.get("state"), { "foo": 2, });

    expect(ymap.get("state").get("foo")).toBe(2);
  });

  it("Applies deletes to maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": 1, }));
    patchSharedType(ymap.get("state"), { });

    expect(Array.from(ymap.get("state").keys())).toEqual([]);
  });

  it("Applies additions to maps nested in maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": { }, }));
    patchSharedType(ymap.get("state"), { "foo": { "bar": 2, }, });

    expect(ymap.get("state")
      .get("foo")
      .get("bar")).toBe(2);
  });

  it("Applies updates to maps nested in maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": { "bar": 1, }, }));
    patchSharedType(ymap.get("state"), { "foo": { "bar": 2, }, });

    expect(ymap.get("state")
      .get("foo")
      .get("bar")).toBe(2);
  });

  it("Applies deletions to maps nested in maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": { "bar": 1, }, }));
    patchSharedType(ymap.get("state"), { "foo": { }, });

    expect(Array.from(ymap.get("state")
      .get("foo")
      .keys())).toEqual([]);
  });

  it("Applies additions to arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ ]));
    patchSharedType(ymap.get("array"), [ 1 ]);

    expect(ymap.get("array").get(0)).toBe(1);
  });

  it("Applies deletions to arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ 1 ]));
    patchSharedType(ymap.get("array"), [ ]);

    expect(ymap.get("array").length).toBe(0);
  });

  it("Combines additions and deletions into updates for arrays", () =>
  {
    ymap.set("array", arrayToYArray([ 1 ]));
    patchSharedType(ymap.get("array"), [ 2, 3 ]);

    expect(ymap.get("array").get(0)).toBe(2);
    expect(ymap.get("array").get(1)).toBe(3);
  });

  it("Applies additions to arrays nested in arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ 1, [ ] ]));
    patchSharedType(ymap.get("array"), [ 1, [ 2 ] ]);

    expect(ymap.get("array")
      .get(1)
      .get(0)).toBe(2);
  });

  it("Applies deletions to arrays nested in arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ 1, [ 2, 3 ] ]));
    patchSharedType(ymap.get("array"), [ 1, [ 2 ] ]);

    expect(ymap.get("array").get(1)).toHaveLength(1);
  });

  it("Applies additions and deletions into updates for nested arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ 1, [ 2, 3 ] ]));
    patchSharedType(ymap.get("array"), [ 1, [ 2, 4 ] ]);

    expect(ymap.get("array")
      .get(1)
      .get(1)).toBe(4);
  });
});