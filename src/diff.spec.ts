import { ChangeType, } from "./types";
import { diff, diffText, getChanges, } from "./diff";

describe.only("getChanges", () =>
{
  describe("When given objects", () =>
  {
    it.each([
      [ {} ],
      [ { "foo": 1, } ],
      [ { "foo": null, } ], // See GitHub Issue #32
      [ { "foo": undefined, } ], // See GitHub Issue #32
      [ { "foo": { "bar": 1, }, } ]
    ])("Returns an empty list for two identical objects.", (a) =>
    {
      expect(getChanges(a, a)).toStrictEqual([]);
    });

    it.each([
      [
        {},
        { "foo": 1, },
        [
          [ ChangeType.INSERT, "foo", 1 ]
        ]
      ],
      [
        { "foo": 1, },
        {},
        [
          [ ChangeType.DELETE, "foo", undefined ]
        ]
      ],
      [
        { "foo": 1, },
        { "foo": 2, },
        [
          [ ChangeType.UPDATE, "foo", 2 ]
        ]
      ],
      [
        { "foo": 1, },
        { "bar": 1, },
        [
          [ ChangeType.DELETE, "foo", undefined ],
          [ ChangeType.INSERT, "bar", 1 ]
        ]
      ],
      [
        { "foo": 1, "bar": 3, },
        { "foo": 1, "bar": 2, },
        [
          [ ChangeType.UPDATE, "bar", 2 ]
        ]
      ]
    ])("Generates a change list for objects", (a, b, changes) =>
    {
      expect(getChanges(a, b)).toStrictEqual(changes);
    });
  });

  describe("When given arrays", () =>
  {
    it.each([
      [ [ 1, 2, 3 ] ],
      [ [ null, null, null ] ], // See GitHub Issue #32
      [ [ { "foo": 1, } ] ]
    ])("Returns an empty list for identical arrays", (a) =>
    {
      expect(getChanges(a, a)).toStrictEqual([]);
    });

    it.each([
      [
        [ 1, 2, 3 ],
        [ 1, 2 ],
        [
          [ ChangeType.DELETE, 2, undefined ]
        ]
      ],
      [
        [ 1, 2 ],
        [ 1, 2, 3 ],
        [
          [ ChangeType.INSERT, 2, 3 ]
        ]
      ],
      [
        [ 1, 3 ],
        [ 1, 2, 3 ],
        [
          [ ChangeType.INSERT, 1, 2 ]
        ]
      ],
      [
        [ 0, 2, 3 ],
        [ 1, 2, 3 ],
        [
          [ ChangeType.UPDATE, 0, 1 ]
        ]
      ],
      /*
       * This is an edge case in how we perform change detection.
       *
       * In this case, A contains a repeated sequence of digits that is not in
       * B. This confuses the look ahead, which, in order to detect an update,
       * looks to the next value in B to see if the value found in A has just
       * moved.
       *
       * When it sees that A's position 1, with a value of 3, is not the same as
       * B's position 1 (with a value of 2), the look ahead checks to see if
       * B's position 2 is the same as A's position 1. It is, so the algorithm
       * assumes that an insertion took place in B.
       *
       * This insertion causes an increase in the indexing offset for B. When
       * that happens, the next iteration is looking at B position 3 (does not
       * exist) instead of position 3. Because B position 3 does not exist, it
       * is assumed that the duplicate value was deleted in B.
       *
       * As far as I know, there's no way around this. One option is that we
       * could increase the look ahead. But by doing that, we change the minimum
       * length of the sequence this happens with. If we added, say, a look
       * ahead of two positions, we'd eliminate the issue with values repeated
       * twice, but not for values repeated three times.
       *
       * Another option is to retroactively recognize a repeated sequence and
       * then correct the previous insertion to an update when we try to delete
       * the end of the sequence. However, this has other issues, such as the
       * ambiguity about what to do when an update happens at the beginning of
       * a repeated sequence and a delete happens at the end. That could be
       * construed as an insert at the beginning and two deletes at the end.
       *
       * At the end of the day, a correct transformation is better than a
       * 'correct' change list.
       */
      [
        [ 1, 3, 3 ],
        [ 1, 2, 3 ],
        [
          [ ChangeType.INSERT, 1, 2 ],
          [ ChangeType.DELETE, 2, undefined ]
        ]
      ],
      [
        [ { "foo": 1, } ],
        [ { "foo": 1, }, { "bar": 2, } ],
        [ [ ChangeType.INSERT, 1, { "bar": 2, } ] ]
      ],
      [
        [ { "foo": 1, } ],
        [ { "foo": 2, }, { "foo": 1, } ],
        [
          [ ChangeType.INSERT, 0, { "foo": 2, } ]
        ]
      ],
      [
        [ { "foo": 1, }, { "foo": 2, } ],
        [ { "foo": 0, }, { "foo": 1, }, { "foo": 2, } ],
        [
          [ ChangeType.INSERT, 0, { "foo": 0, } ]
        ]
      ],
      [
        [ { "foo": 1, }, { "foo": 2, } ],
        [ { "foo": 1, }, { "foo": 1, }, { "foo": 2, } ],
        [
          [ ChangeType.INSERT, 0, { "foo": 1, } ]
        ]
      ],
      [
        [ { "foo": 1, }, { "foo": 2, }, { "foo": 3, } ],
        [ { "foo": 1, }, { "foo": 2, }, { "foo": 2, }, { "foo": 3, } ],
        [
          [ ChangeType.INSERT, 1, { "foo": 2, } ]
        ]
      ],
      [
        [ { "foo": 1, } ],
        [ { "foo": 0, } ],
        [
          [
            ChangeType.PENDING,
            0,
            [
              [ ChangeType.UPDATE, "foo", 0 ]
            ]
          ]
        ]
      ]
    ])("Returns a change list for arrays", (a, b, changes) =>
    {
      expect(getChanges(a, b)).toStrictEqual(changes);
    });
  });

  describe("When given strings", () =>
  {
    it.each([
      [ "", "" ],
      [ "a", "a" ],
      [ "hello, world!", "hello, world!" ]
    ])("Returns undefined for identical sequences", (a, b) =>
    {
      expect(getChanges(a, b)).toStrictEqual([]);
    });

    it.each([
      [ "a", "", [ [ ChangeType.DELETE, 0, undefined ] ] ],
      [ "", "a", [ [ ChangeType.INSERT, 0, "a" ] ] ],
      [ "a", "ab", [ [ ChangeType.INSERT, 1, "b" ] ] ],
      [ "ab", "a", [ [ ChangeType.DELETE, 1, undefined ] ] ],
      [
        "ab",
        "ac",
        [
          [ ChangeType.DELETE, 1, undefined ],
          [ ChangeType.INSERT, 1, "c" ]
        ]
      ],
      [
        "ac",
        "bc",
        [
          [ ChangeType.DELETE, 0, undefined ],
          [ ChangeType.INSERT, 0, "b" ]
        ]
      ],
      [
        "ab",
        "",
        [
          [ ChangeType.DELETE, 0, undefined ],
          [ ChangeType.DELETE, 0, undefined ]
        ]
      ],
      [
        "",
        "ab",
        [
          [ ChangeType.INSERT, 0, "a" ],
          [ ChangeType.INSERT, 1, "b" ]
        ]
      ]
    ])("Returns a change tuple for sequences that are different", (a, b, diff) =>
    {
      expect(getChanges(a, b)).toStrictEqual(diff);
    });

    it.each([
      [
        "hello",
        "goodbye",
        [
          [ ChangeType.INSERT, 0, "g" ],
          [ ChangeType.INSERT, 1, "o" ],
          [ ChangeType.INSERT, 2, "o" ],
          [ ChangeType.INSERT, 3, "d" ],
          [ ChangeType.INSERT, 4, "b" ],
          [ ChangeType.INSERT, 5, "y" ],
          [ ChangeType.DELETE, 6, undefined ],
          [ ChangeType.DELETE, 7, undefined ],
          [ ChangeType.DELETE, 7, undefined ],
          [ ChangeType.DELETE, 7, undefined ]
        ]
      ],
      [
        "hello, world!",
        "goodbye, world.",
        [
          [ ChangeType.INSERT, 0, "g" ],
          [ ChangeType.INSERT, 1, "o" ],
          [ ChangeType.INSERT, 2, "o" ],
          [ ChangeType.INSERT, 3, "d" ],
          [ ChangeType.INSERT, 4, "b" ],
          [ ChangeType.INSERT, 5, "y" ],
          [ ChangeType.DELETE, 6, undefined ],
          [ ChangeType.DELETE, 7, undefined ],
          [ ChangeType.DELETE, 7, undefined ],
          [ ChangeType.DELETE, 7, undefined ],
          [ ChangeType.INSERT, 14, "." ],
          [ ChangeType.DELETE, 15, undefined ]
        ]
      ]
    ])("Adjusts indices to account for previous changes.", (a, b, diff) =>
    {
      expect(getChanges(a, b)).toStrictEqual(diff);
    });
  });
});

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
    [ "a", "", [ [ "delete", 0, undefined ] ] ],
    [ "", "a", [ [ "add", 0, "a" ] ] ],
    [ "a", "ab", [ [ "add", 1, "b" ] ] ],
    [ "ab", "a", [ [ "delete", 1, undefined ] ] ],
    [ "ab", "ac", [ [ "delete", 1, undefined ], [ "add", 1, "c" ] ] ],
    [ "ac", "bc", [ [ "delete", 0, undefined ], [ "add", 0, "b" ] ] ],
    [ "ab", "", [ [ "delete", 0, undefined ], [ "delete", 0, undefined ] ] ],
    [ "", "ab", [ [ "add", 0, "a" ], [ "add", 1, "b" ] ] ]
  ])("Returns a change tuple for sequences that are different", (a, b, diff) =>
  {
    expect(diffText(a, b)).toStrictEqual(diff);
  });

  it.each([
    [
      "hello",
      "goodbye",
      [
        [ "add", 0, "g" ],
        [ "add", 1, "o" ],
        [ "add", 2, "o" ],
        [ "add", 3, "d" ],
        [ "add", 4, "b" ],
        [ "add", 5, "y" ],
        [ "delete", 6, undefined ],
        [ "delete", 7, undefined ],
        [ "delete", 7, undefined ],
        [ "delete", 7, undefined ]
      ]
    ],
    [
      "hello, world!",
      "goodbye, world.",
      [
        [ "add", 0, "g" ],
        [ "add", 1, "o" ],
        [ "add", 2, "o" ],
        [ "add", 3, "d" ],
        [ "add", 4, "b" ],
        [ "add", 5, "y" ],
        [ "delete", 6, undefined ],
        [ "delete", 7, undefined ],
        [ "delete", 7, undefined ],
        [ "delete", 7, undefined ],
        [ "add", 14, "." ],
        [ "delete", 15, undefined ]
      ]
    ]
  ])("Adjusts indices to account for previous changes.", (a, b, diff) =>
  {
    expect(diffText(a, b)).toStrictEqual(diff);
  });
});