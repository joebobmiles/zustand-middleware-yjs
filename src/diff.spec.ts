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
  });
});