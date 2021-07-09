import { getChangeList, } from "./patching";

describe("getChangeList", () =>
{
  it(
    "Should create an empty array for two values that are identical.",
    () =>
    {
      expect(getChangeList({}, {})).toEqual([]);
    }
  );

  it(
    "Should create an add entry when b contains a new item.",
    () =>
    {
      expect(getChangeList({}, { "foo": 1, })).toEqual([ [ "add", "foo", 1 ] ]);
    }
  );

  it(
    "Should create an update entry when b contains a new value.",
    () =>
    {
      expect(getChangeList({ "foo": 1, }, { "foo": 2, }))
        .toEqual([ [ "update", "foo", 2 ] ]);
    }
  );

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
      { "foo": { "bar": 2, }, }
    ],
    [
      { "foo": [ 1 ], },
      { "foo": [ 1, 2 ], }
    ]
  ])(
    "Should create a pending entry when a and b have nested data. (#%#)",
    (a, b) =>
    {
      expect(getChangeList(a, b))
        .toEqual([ [ "pending", "foo", undefined ] ]);
    }
  );
});