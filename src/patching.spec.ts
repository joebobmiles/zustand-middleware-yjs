import * as Y from "yjs";
import { objectToYMap, } from "./mapping";
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
  it("Applies additions to the given shared type.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("state", objectToYMap({ }));
    patchSharedType(ymap.get("state"), { "foo": 1, });

    expect(ymap.get("state").get("foo")).toBe(1);
  });

  it("Applies updates to the given shared type.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("state", objectToYMap({ "foo": 1, }));
    patchSharedType(ymap.get("state"), { "foo": 2, });

    expect(ymap.get("state").get("foo")).toBe(2);
  });

  it("Applies deletes to the given shared type.", () =>
  {
    const ydoc = new Y.Doc();
    const ymap = ydoc.getMap("tmp");

    ymap.set("state", objectToYMap({ "foo": 1, }));
    patchSharedType(ymap.get("state"), { });

    expect(Array.from(ymap.get("state").keys())).toEqual([]);
  });
});