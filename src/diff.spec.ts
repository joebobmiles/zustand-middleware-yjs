import { ChangeType, } from "./types";
import { getChanges, } from "./diff";

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
      expect(getChanges(a, a, new Set())).toStrictEqual([]);
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
      ],
      [
        { "foo": 1, },
        { "foo": "a", },
        [
          [ ChangeType.UPDATE, "foo", "a" ]
        ]
      ],
      [
        { "foo": "a", },
        { "foo": "", },
        [
          [
            ChangeType.PENDING,
            "foo",
            [
              [ ChangeType.DELETE, 0, undefined ]
            ]
          ]
        ]
      ],
      [
        { "foo": "a", },
        { "foo": "b", },
        [
          [
            ChangeType.PENDING,
            "foo",
            [
              [ ChangeType.DELETE, 0, undefined ],
              [ ChangeType.INSERT, 0, "b" ]
            ]
          ]
        ]
      ],
      [
        { "foo": "ab", },
        { "foo": "bc", },
        [
          [
            ChangeType.PENDING,
            "foo",
            [
              [ ChangeType.DELETE, 0, undefined ],
              [ ChangeType.INSERT, 1, "c" ]
            ]
          ]
        ]
      ],
      [
        { "foo": [ 1 ], },
        { "foo": [ 2 ], },
        [
          [
            ChangeType.PENDING,
            "foo",
            [
              [ ChangeType.UPDATE, 0, 2 ]
            ]
          ]
        ]
      ],
      [
        { "foo": [ 1, 2 ], },
        { "foo": [ 2, 2 ], },
        [
          [
            ChangeType.PENDING,
            "foo",
            [
              [ ChangeType.UPDATE, 0, 2 ]
            ]
          ]
        ]
      ],
      [
        { "foo": [ 1, 2, 2 ], },
        { "foo": [ 1, 2, 3 ], },
        [
          [
            ChangeType.PENDING,
            "foo",
            [
              [ ChangeType.UPDATE, 2, 3 ]
            ]
          ]
        ]
      ],
      [
        { "foo": [ 1, 2, 2 ], },
        { "foo": [ 1, 2 ], },
        [
          [
            ChangeType.PENDING,
            "foo",
            [
              [ ChangeType.DELETE, 2, undefined ]
            ]
          ]
        ]
      ]
    ])("Generates a change list for objects", (a, b, changes) =>
    {
      expect(getChanges(a, b, new Set())).toStrictEqual(changes);
    });

    it("Ignores properties whose values are functions", () =>
    {
      const a = {
        "foo": () =>
          1,
      };

      const b = {};

      expect(getChanges(a, b, new Set())).toStrictEqual([]);
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
      expect(getChanges(a, a, new Set())).toStrictEqual([]);
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
      ],
      [
        [ { "foo": 1, } ],
        [ ],
        [
          [
            ChangeType.DELETE,
            0,
            undefined
          ]
        ]
      ],
      [
        [ { "foo": 1, } ],
        [ {} ],
        [
          [
            ChangeType.PENDING,
            0,
            [
              [
                ChangeType.DELETE,
                "foo",
                undefined
              ]
            ]
          ]
        ]
      ],
      [
        [ "a" ],
        [ "" ],
        [
          [
            ChangeType.PENDING,
            0,
            [
              [ ChangeType.DELETE, 0, undefined ]
            ]
          ]
        ]
      ],
      [
        [ "ab" ],
        [ "bc" ],
        [
          [
            ChangeType.PENDING,
            0,
            [
              [ ChangeType.DELETE, 0, undefined ],
              [ ChangeType.INSERT, 1, "c" ]
            ]
          ]
        ]
      ]
    ])("Returns a change list for arrays", (a, b, changes) =>
    {
      expect(getChanges(a, b, new Set())).toStrictEqual(changes);
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
      expect(getChanges(a, b, new Set())).toStrictEqual([]);
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
      ],
      // No common subsequence test cases.
      [
        "a",
        "b",
        [
          [ ChangeType.DELETE, 0, undefined ],
          [ ChangeType.INSERT, 0, "b" ]
        ]
      ],
      [
        "ab",
        "cd",
        [
          [ ChangeType.DELETE, 0, undefined ],
          [ ChangeType.DELETE, 0, undefined ],
          [ ChangeType.INSERT, 0, "c" ],
          [ ChangeType.INSERT, 1, "d" ]
        ]
      ]
    ])("Returns a change tuple for sequences that are different", (a, b, diff) =>
    {
      expect(getChanges(a, b, new Set())).toStrictEqual(diff);
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
      expect(getChanges(a, b, new Set())).toStrictEqual(diff);
    });

    it.each([
      [
        {  },
        { a: 'av', b: 'bv' },
        new Set(['a']),
        [
          [ChangeType.INSERT, "a", "av"],
          [ChangeType.INSERT, "b", "bv"]
        ]
      ],
      [
        { a: 'av', b: 'bv' },
        { a: 'ao', b: 'bo' },
        new Set(['a']),
        [
          [
            ChangeType.UPDATE, "a", "ao"
          ],
          [
            ChangeType.PENDING, "b",
            [
              [ChangeType.DELETE, 1, undefined],
              [ChangeType.INSERT, 1, "o"]
            ]
          ],
        ],
      ],
      [
        { a: 'av', b: 'bv' },
        { },
        new Set(['a']),
        [
          [ChangeType.DELETE, "a", undefined],
          [ChangeType.DELETE, "b", undefined]
        ]
      ],
      [
        { a: [{ c: 'c0v' }, { c: 'c1v' }] },
        { a: [{ c: 'c0o' }, { c: 'c1v' }] },
        new Set(['c']),
        [
          [
            ChangeType.PENDING,
            "a",
            [
              [
                ChangeType.PENDING,
                0,
                [
                  [ChangeType.UPDATE, "c", "c0o"]
                ]
              ]
            ]
          ]
        ]
      ]
    ])("Creates a single change for an atomic property.", (a, b, atomicProps, diff) => {
      expect(getChanges(a, b, atomicProps)).toStrictEqual(diff);
    })
  });
});
