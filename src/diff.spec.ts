import { diff, } from "./diff";

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
    it("Returns undefined for two objects with identical contents.", () =>
    {
      expect(diff({ "foo": 1, }, { "foo": 1, })).toBeUndefined();
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
    it("Returns undefined for arrays with identical contents.", () =>
    {
      expect(diff([ 1, 2, 3 ], [ 1, 2, 3 ])).toBeUndefined();
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
  });
});