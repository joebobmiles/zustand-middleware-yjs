import * as Y from "yjs";
import { createStore as create, } from "zustand/vanilla";
import { arrayToYArray, objectToYMap, } from "./mapping";
import {
  patchSharedType,
  patchStore,
} from "./patching";

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

  it("Applies additions to empty map.", () =>
  {
    patchSharedType(ymap, { "foo": 1, }, new Set());

    expect(ymap.get("foo")).toBe(1);
  });

  it("Applies additions to maps.", () =>
  {
    ymap.set("state", objectToYMap({ }, new Set()));
    patchSharedType(ymap.get("state"), { "foo": 1, }, new Set());

    expect(ymap.get("state").get("foo")).toBe(1);
  });

  it("Applies updates to maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": 1, }, new Set()));
    patchSharedType(ymap.get("state"), { "foo": 2, }, new Set());

    expect(ymap.get("state").get("foo")).toBe(2);
  });

  it("Creates a map when value is updated from scalar to object.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": 1, }, new Set()));
    patchSharedType(ymap.get("state"), { "foo": { "bar": 2, }, }, new Set());

    expect((ymap.get("state").get("foo") as Y.Map<any>).get("bar")).toBe(2);
  });

  it("Creates an array when value is updated from scalar to array.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": 1, }, new Set()));
    patchSharedType(ymap.get("state"), { "foo": [ 1, 2 ], }, new Set());

    expect((ymap.get("state").get("foo") as Y.Array<any>).get(0)).toEqual(1);
  });

  it("Applies deletes to maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": 1, }, new Set()));
    patchSharedType(ymap.get("state"), { }, new Set());

    expect(Array.from(ymap.get("state").keys())).toEqual([]);
  });

  it("Applies additions to maps nested in maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": { }, }, new Set()));
    patchSharedType(ymap.get("state"), { "foo": { "bar": 2, }, }, new Set());

    expect(ymap.get("state")
      .get("foo")
      .get("bar")).toBe(2);
  });

  it("Applies updates to maps nested in maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": { "bar": 1, }, }, new Set()));
    patchSharedType(ymap.get("state"), { "foo": { "bar": 2, }, }, new Set());

    expect(ymap.get("state")
      .get("foo")
      .get("bar")).toBe(2);
  });

  it("Applies deletions to maps nested in maps.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": { "bar": 1, }, }, new Set()));
    patchSharedType(ymap.get("state"), { "foo": { }, }, new Set());

    expect(Array.from(ymap.get("state")
      .get("foo")
      .keys())).toEqual([]);
  });

  it("Applies additions to arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ ], new Set()));
    patchSharedType(ymap.get("array"), [ 1 ], new Set());

    expect(ymap.get("array").get(0)).toBe(1);
  });

  it("Applies deletions to arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ 1 ], new Set()));
    patchSharedType(ymap.get("array"), [ ], new Set());

    expect(ymap.get("array").length).toBe(0);
  });

  it.each([
    [
      [ 1, 2, 3 ],
      [ 1 ]
    ],
    [
      [ 1, 2, 3, 4 ],
      [ 1, 4 ]
    ]
  ])("Deletes multiple items from arrays", (initialState, updatedState) =>
  {
    ymap.set("array", arrayToYArray(initialState, new Set()));
    patchSharedType(ymap.get("array"), updatedState, new Set());

    expect(ymap.get("array").length).toBe(updatedState.length);
    expect(ymap.get("array").toJSON()).toEqual(updatedState);
  });

  it("Combines additions and deletions into updates for arrays", () =>
  {
    ymap.set("array", arrayToYArray([ 1 ], new Set()));
    patchSharedType(ymap.get("array"), [ 2, 3 ], new Set());

    expect(ymap.get("array").get(0)).toBe(2);
    expect(ymap.get("array").get(1)).toBe(3);
  });

  it("Applies additions of nested arrays in arrays", () =>
  {
    ymap.set("array", arrayToYArray([ 1 ], new Set()));
    patchSharedType(ymap.get("array"), [ 1, [ 2 ] ], new Set());

    expect((ymap.get("array").get(1) as Y.Array<any>).toJSON()).toEqual([ 2 ]);
  });

  it("Applies additions of nested objects in arrays", () =>
  {
    ymap.set("array", arrayToYArray([ 1 ], new Set()));
    patchSharedType(ymap.get("array"), [ 1, { "foo": 2, } ], new Set());

    expect((ymap.get("array").get(1) as Y.Map<any>).toJSON())
      .toEqual({ "foo": 2, });
  });

  it("Applies additions to arrays nested in arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ 1, [ ] ], new Set()));
    patchSharedType(ymap.get("array"), [ 1, [ 2 ] ], new Set());

    expect(ymap.get("array")
      .get(1)
      .get(0)).toBe(2);
  });

  it("Applies deletions to arrays nested in arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ 1, [ 2, 3 ] ], new Set()));
    patchSharedType(ymap.get("array"), [ 1, [ 2 ] ], new Set());

    expect(ymap.get("array").get(1)).toHaveLength(1);
  });

  it("Applies additions and deletions into updates for nested arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ 1, [ 2, 3 ] ], new Set()));
    patchSharedType(ymap.get("array"), [ 1, [ 2, 4 ] ], new Set());

    expect(ymap.get("array")
      .get(1)
      .get(1)).toBe(4);
  });

  it("Applies additions to arrays nested in objects.", () =>
  {
    ymap.set("map", objectToYMap({ "foo": [ 1, 2 ], }, new Set()));
    patchSharedType(ymap.get("map"), { "foo": [ 1, 2, 3 ], }, new Set());

    expect(ymap.get("map").get("foo")
      .get(2)).toBe(3);
  });

  it("Applies updates to arrays nested in objects.", () =>
  {
    ymap.set("map", objectToYMap({ "foo": [ 1, 2, 3 ], }, new Set()));
    patchSharedType(ymap.get("map"), { "foo": [ 1, 4, 3 ], }, new Set());

    expect(ymap.get("map").get("foo")
      .get(1)).toBe(4);
  });

  it("Applies deletions to arrays nested in objects.", () =>
  {
    ymap.set("map", objectToYMap({ "foo": [ 1, 2, 3 ], }, new Set()));
    patchSharedType(ymap.get("map"), { "foo": [ 1, 2 ], }, new Set());

    expect(ymap.get("map").get("foo")).toHaveLength(2);
  });

  it("Applies additions to objects nested in arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ { "foo": 1, } ], new Set()));
    patchSharedType(ymap.get("array"), [ { "foo": 1, "bar": 2, } ], new Set());

    expect(ymap.get("array").get(0)
      .get("bar")).toBe(2);
  });

  it("Applies updates to objects nested in arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ { "foo": { "bar": 1, }, } ], new Set()));
    patchSharedType(ymap.get("array"), [ { "foo": { "bar": 2, }, } ], new Set());

    expect(ymap.get("array")
      .get(0)
      .get("foo")
      .get("bar")).toBe(2);
  });

  it("Applies deletions to objects nested in arrays.", () =>
  {
    ymap.set("array", arrayToYArray([ { "foo": { "bar": 1, "baz": 2, }, } ], new Set()));
    patchSharedType(ymap.get("array"), [ { "foo": { "bar": 1, }, } ], new Set());

    expect(ymap.get("array")
      .get(0)
      .get("foo")
      .get("baz")).toBeUndefined();
  });

  it("Ignores when functions are added.", () =>
  {
    ymap.set("state", objectToYMap({ }, new Set()));
    patchSharedType(
      ymap.get("state"),
      {
        "foo": () =>
          null,
      },
      new Set()
    );

    expect(ymap.get("state").get("foo")).toBeUndefined();
  });

  it("Ignores when values are set to functions.", () =>
  {
    ymap.set("state", objectToYMap({ "foo": 1, }, new Set()));
    patchSharedType(
      ymap.get("state"),
      {
        "foo": () =>
          null,
      },
      new Set()
    );

    expect(ymap.get("state").get("foo")).toBe(1);
  });

  it("Applies additions to text", () =>
  {
    ymap.set("text", new Y.Text("a"));
    patchSharedType(ymap.get("text"), "ab", new Set());

    expect(ymap.get("text").toString()).toBe("ab");
  });

  it("Applies deletions to text", () =>
  {
    ymap.set("text", new Y.Text("ab"));
    patchSharedType(ymap.get("text"), "a", new Set());

    expect(ymap.get("text").toString()).toBe("a");
  });

  it("Combines additions and deletions to text", () =>
  {
    ymap.set("text", new Y.Text("ab"));
    patchSharedType(ymap.get("text"), "bc", new Set());

    expect(ymap.get("text").toString()).toBe("bc");
  });

  it("Converts strings to YText in objects", () =>
  {
    ymap.set("state", objectToYMap({ "foo": null, }, new Set()));
    patchSharedType(
      ymap.get("state"),
      {
        "foo": "bar",
      },
      new Set()
    );

    expect(ymap.get("state").get("foo")).toBeInstanceOf(Y.Text);
    expect(ymap.get("state").get("foo")
      .toString()).toBe("bar");
  });

  it("Converts strings to YText in arrays", () =>
  {
    ymap.set("state", arrayToYArray([], new Set()));
    patchSharedType(
      ymap.get("state"),
      [ "bar" ],
      new Set()
    );

    expect(ymap.get("state").get(0)).toBeInstanceOf(Y.Text);
    expect(ymap.get("state").get(0)
      .toString()).toBe("bar");
  });
});

describe("patchStore", () =>
{
  it("Applies additions to objects.", () =>
  {
    const store = create(() =>
      ({ }));

    const update = { "foo": 2, };

    patchStore(store, update, new Set());

    expect((store.getState() as { "foo": number, }).foo).toBe(2);
  });

  it("Applies updates to objects.", () =>
  {
    const store = create(() =>
      ({
        "foo": 1,
      }));

    const update = { "foo": 2, };

    patchStore(store, update, new Set());

    expect(store.getState().foo).toBe(2);
  });

  it("Applies deletions to objects.", () =>
  {
    const store = create(() =>
      ({
        "foo": 1,
      }));

    const update = { };

    patchStore(store, update, new Set());

    expect(store.getState().foo).toBeUndefined();
  });

  it("Applies additions to nested objects.", () =>
  {
    const store = create(() =>
      ({
        "foo": { },
      }));

    const update = {
      "foo": {
        "bar": 1,
      },
    };

    patchStore(store, update, new Set());

    expect((store.getState().foo as { "bar": number, }).bar).toBe(1);
  });

  it("Applies updates to nested objects.", () =>
  {
    const store = create(() =>
      ({
        "foo": { "bar": 2, },
      }));

    const update = {
      "foo": {
        "bar": 3,
      },
    };

    patchStore(store, update, new Set());

    expect(store.getState().foo.bar).toBe(3);
  });

  it("Applies deletions to nested objects.", () =>
  {
    const store = create(() =>
      ({
        "foo": { "bar": 2, },
      }));

    const update = {
      "foo": { },
    };

    patchStore(store, update, new Set());

    expect(store.getState().foo.bar).toBeUndefined();
  });

  it("Applies additions to arrays.", () =>
  {
    const store = create(() =>
      ({
        "foo": [ ],
      }));

    const update = {
      "foo": [ 1 ],
    };

    patchStore(store, update, new Set());

    expect(store.getState().foo[0]).toBe(1);
  });

  it("Applies deletions to arrays.", () =>
  {
    const store = create(() =>
      ({
        "foo": [ 1 ],
      }));

    const update = {
      "foo": [ ],
    };

    patchStore(store, update, new Set());

    expect(store.getState().foo[0]).toBeUndefined();
  });

  it("Combines additions and deletions as updates to arrays.", () =>
  {
    const store = create(() =>
      ({
        "foo": [ 1, 3, 3 ],
      }));

    const update = {
      "foo": [ 1, 2, 3 ],
    };

    patchStore(store, update, new Set());

    expect(store.getState().foo[1]).toBe(2);
  });

  it("Applies additions to nested arrays.", () =>
  {
    const store = create(() =>
      ({
        "foo": [ 1, [ 2 ] ],
      }));

    const update = {
      "foo": [ 1, [ 2, 3 ] ],
    };

    patchStore(store, update, new Set());

    expect((store.getState().foo[1] as number[])[1]).toBe(3);
  });

  it("Applies deletions to nested arrays.", () =>
  {
    const store = create(() =>
      ({
        "foo": [ 1, [ 2, 3 ] ],
      }));

    const update = {
      "foo": [ 1, [ 2 ] ],
    };

    patchStore(store, update, new Set());

    expect((store.getState().foo[1] as number[])[1]).toBeUndefined();
  });

  it("Combines additions and deletions as updates to nested arrays.", () =>
  {
    const store = create(() =>
      ({
        "foo": [ 1, [ 2, 4 ] ],
      }));

    const update = {
      "foo": [ 1, [ 2, 3 ] ],
    };

    patchStore(store, update, new Set());

    expect((store.getState().foo[1] as number[])[1]).toBe(3);
  });

  it("Applies additions to objects nested in arrays.", () =>
  {
    const store = create(() =>
      ({
        "foo": [ { "bar": 1, } ],
      }));

    const update = {
      "foo": [ { "bar": 1, "baz": 2, } ],
    };

    patchStore(store, update, new Set());

    expect(((store.getState().foo[0] as unknown) as { "baz": number }).baz)
      .toBe(2);
  });

  it("Applies updates to objects nested in arrays.", () =>
  {
    const store = create(() =>
      ({
        "foo": [ { "bar": 1, "baz": 1, } ],
      }));

    const update = {
      "foo": [ { "bar": 1, "baz": 2, } ],
    };

    patchStore(store, update, new Set());

    expect(store.getState().foo[0].baz).toBe(2);
  });

  it("Applies deletions to objects nested in arrays.", () =>
  {
    const store = create(() =>
      ({
        "foo": [ { "bar": 1, "baz": 1, } ],
      }));

    const update = {
      "foo": [ { "bar": 1, } ],
    };

    patchStore(store, update, new Set());

    expect(store.getState().foo[0].baz).toBeUndefined();
  });

  it("Preserves functions contained in the store.", () =>
  {
    type State =
    {
      "count": number,
      "increment": () => void,

      "room": {
        "users": string[],
        "join": (user: string) => void,
      },
    };

    const store = create<State>((set) =>
      ({
        "count": 1,
        "increment": () =>
          set((state) =>
            ({ ...state, "count": state.count + 1, })),
        "room": {
          "users": [],
          "join": (user) =>
            set((state) =>
              ({
                ...state,
                "room": {
                  ...state.room,
                  "users": [ ...state.room.users, user ],
                },
              })),
        },
      }));

    const update = {
      "count": 3,
      "room": {
        "users": [],
      },
    };

    patchStore(store, update, new Set());

    expect(store.getState().increment).not.toBeUndefined();
    expect(store.getState().room.join).not.toBeUndefined();
  });

  it("Does not drop nested data.", () =>
  {
    type State =
    {
      "owner": {
        "person": {
          "age": number,
          "name": string,
        },
      },
    };

    const store = create<State>(() =>
      ({
        "owner": {
          "person": {
            "age": 0,
            "name": "Joe",
          },
        },
      }));

    patchStore(
      store,
      { "owner": { "person": { "age": 1, "name": "Joe", }, }, },
      new Set()
    );

    expect(store.getState())
      .toEqual({ "owner": { "person": { "age": 1, "name": "Joe", }, }, });
  });

  it("Does not truncate state if there are no changes.", () =>
  {
    type State =
    {
      "count": 0,
    };

    const store = create<State>(() =>
      ({
        "count": 0,
      }));

    patchStore(
      store,
      { "count": 0, },
      new Set()
    );

    expect(store.getState()).toEqual({ "count": 0, });
  });

  it.each([
    [ "a", "b" ],
    [ "a", "" ],
    [ "ab", "cd" ],
    [ "ab", "bc" ]
  ])("Applies changes to strings", (a, b) =>
  {
    type State = {
      "string": string,
    };

    const store = create<State>(() =>
      ({
        "string": a,
      }));

    patchStore(
      store,
      { "string": b, },
      new Set()
    );

    expect(store.getState()).toEqual({ "string": b, });
  });
});
