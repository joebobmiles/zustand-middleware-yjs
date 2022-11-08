import { diff, diffText, } from "./diff";

describe("diff", () =>
{
  describe("When passed scalar values", () =>
  {
    it("Returns undefined for two identical numbers.", () =>
    {
      expect(diff(1, 1)).toBeUndefined();
    });

    it("Returns undefined for two identical strings.", () =>
    {
      expect(diff("hello", "hello")).toBeUndefined();
    });

    // See GitHub Issue #32
    it.each([
      null,
      undefined
    ])("Returns undefined for two null/undefined values.", (nonValue) =>
    {
      expect(diff(nonValue, nonValue)).toBeUndefined();
    });

    it(
      "Returns { __old: <old>, __new: <new> } for different values.",
      () =>
      {
        expect(diff(1, 2)).toEqual({
          "__old": 1,
          "__new": 2,
        });
      }
    );
  });

  describe("When passed objects", () =>
  {
    it.each([
      1,
      // See GitHub Issue #32
      null,
      undefined
    ])("Returns undefined for two objects with identical contents.", (value) =>
    {
      expect(diff({ "foo": value, }, { "foo": value, })).toBeUndefined();
    });

    it("Returns undefined for two objects with identical hierarchies.", () =>
    {
      expect(diff(
        { "foo": { "bar": 1, }, },
        { "foo": { "bar": 1, }, }
      )).toBeUndefined();
    });

    it("Returns { <key>__deleted: <old> } when b is missing <key>.", () =>
    {
      expect(diff(
        { "foo": 1, },
        { }
      )).toEqual({
        "foo__deleted": 1,
      });
    });

    it("Returns { <key>__added: <new> } when a is missing <key>.", () =>
    {
      expect(diff(
        { },
        { "foo": 1, }
      )).toEqual({
        "foo__added": 1,
      });
    });

    it(
      "Returns { <key>: { __old: <old>, __new: <new> } } when a and b have "
      +"different <key> values.",
      () =>
      {
        expect(diff(
          { "foo": 1, },
          { "foo": 2, }
        )).toEqual({
          "foo": {
            "__old": 1,
            "__new": 2,
          },
        });
      }
    );

    it("Only returns fields that have changed.", () =>
    {
      expect(diff(
        { "foo": 1, "bar": 2, },
        { "foo": 1, "bar": 3, }
      )).toEqual({
        "bar": {
          "__old": 2,
          "__new": 3,
        },
      });
    });
  });

  describe("When passed arrays of scalar values", () =>
  {
    it.each([
      [ [ 1, 2, 3 ] ],
      // See GitHub Issue #32
      [ [ null, null, null ] ],
      [ [ undefined, undefined, undefined ] ]
    ])("Returns undefined for arrays with identical contents.", (array) =>
    {
      expect(diff(array, array)).toBeUndefined();
    });

    it(
      "Returns [ ..., [ '-', <removed> ], ... ] when b is missing a value.",
      () =>
      {
        expect(diff([ 1, 2, 3 ], [ 1, 2 ])).toEqual([
          [ " ", 1 ],
          [ " ", 2 ],
          [ "-", 3 ]
        ]);
      }
    );

    it(
      "Returns [ ..., [ '+', <added> ], ... ] when a is missing a value.",
      () =>
      {
        expect(diff([ 1, 3 ], [ 1, 2, 3 ])).toEqual([
          [ " ", 1 ],
          [ "+", 2 ],
          [ " ", 3 ]
        ]);
      }
    );

    it(
      "Returns [ ..., [ '-', <removed> ], [ '+', <added> ], ... ] for replaced "
      +"values.",
      () =>
      {
        expect(diff([ 1 ], [ 2 ])).toEqual([ [ "-", 1 ], [ "+", 2 ] ]);
      }
    );

    it("Does not forget additions at the end of b.", () =>
    {
      expect(diff([ 1 ], [ 2, 3 ])).toEqual([
        [ "-", 1 ],
        [ "+", 2 ],
        [ "+", 3 ]
      ]);
    });

    it(
      "Returns [ ..., [ '+', <added> ] ] when a is missing a value.",
      () =>
      {
        expect(diff([ 1, 2 ], [ 1, 2, 3 ])).toEqual([
          [ " ", 1 ],
          [ " ", 2 ],
          [ "+", 3 ]
        ]);
      }
    );

    it("Does not duplicate unchanged value if it is last in the array.", () =>
    {
      expect(diff(
        [ 2 ],
        [ 1, 2 ]
      ))
        .toEqual([
          [ "+", 1 ],
          [ " ", 2 ]
        ]);
    });

    it(
      "Does not duplicate an unchanged element when a new element is inserted "
      +"before it.",
      () =>
      {
        expect(diff(
          [ 1, 2 ],
          [ 0, 1, 2 ]
        ))
          .toEqual([
            [ "+", 0 ],
            [ " ", 1 ],
            [ " ", 2 ]
          ]);
      }
    );
  });

  describe("When passed arrays with nested objects", () =>
  {
    it("Returns undefined for arrays of identical contents.", () =>
    {
      expect(diff([ { "foo": 1, } ], [ { "foo": 1, } ])).toBeUndefined();
    });

    it(
      "Returns [ ..., [ '-', <removed> ], ... ] when b is missing an item.",
      () =>
      {
        expect(diff([ { "foo": 1, }, { "bar": 2, } ], [ { "foo": 1, } ]))
          .toEqual([
            [ " ", { "foo": 1, } ],
            [ "-", { "bar": 2, } ]
          ]);
      }
    );

    it(
      "Returns [ ..., [ '+', <added> ], ... ] when a is missing an item.",
      () =>
      {
        expect(diff([ { "foo": 1, } ], [ { "foo": 1, }, { "bar": 2, } ]))
          .toEqual([
            [ " ", { "foo": 1, } ],
            [ "+", { "bar": 2, } ]
          ]);
      }
    );

    it(
      "Returns [ ..., [ '~', <diff> ], ... ] when the item is modified.",
      () =>
      {
        expect(diff([ { "foo": 1, } ], [ { "foo": 2, } ]))
          .toEqual([
            [ "~", { "foo": { "__old": 1, "__new": 2, }, } ]
          ]);
      }
    );

    it("Does not duplicate existing object if it is last in the array.", () =>
    {
      expect(diff(
        [ { "foo": 1, } ],
        [ { "foo": 2, }, { "foo": 1, } ]
      ))
        .toEqual([
          [ "+", { "foo": 2, } ],
          [ " ", { "foo": 1, } ]
        ]);
    });

    it(
      "Does not duplicate an unchanged element when a new element is inserted "
      +"before it.",
      () =>
      {
        expect(diff(
          [ { "foo": 1, }, { "foo": 2, } ],
          [ { "foo": 0, }, { "foo": 1, }, { "foo": 2, } ]
        ))
          .toEqual([
            [ "+", { "foo": 0, } ],
            [ " ", { "foo": 1, } ],
            [ " ", { "foo": 2, } ]
          ]);
      }
    );
  });
});

describe("diffText", () =>
{
  it.each([
    [ "", "" ],
    [ "a", "a" ],
    [ "hello, world!", "hello, world!" ]
  ])("Returns undefined for identical sequences", (a, b) =>
  {
    expect(diffText(a, b)).toBeUndefined();
  });

  it.each([
    [ "a", "", [ [ "delete", 0, "a" ] ] ],
    [ "", "a", [ [ "add", 0, "a" ] ] ],
    [ "a", "ab", [ [ "add", 1, "b" ] ] ],
    [ "ab", "ac", [ [ "delete", 1, "b" ], [ "add", 1, "c" ] ] ]
  ])("Returns a change tuple for sequences that are different", (a, b, diff) =>
  {
    expect(diffText(a, b)).toStrictEqual(diff);
  });
});