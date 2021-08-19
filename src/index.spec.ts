import create from "zustand/vanilla";

import * as Y from "yjs";
import { WebsocketProvider, } from "y-websocket";

import yjs from ".";

describe("Yjs middleware", () =>
{
  it("Creates a useState function.", () =>
  {
    type Store =
    {
      count: number,
      increment: () => void,
    };

    const { getState, } =
      create<Store>(yjs(
        new Y.Doc(),
        "hello",
        (set) =>
          ({
            "count": 0,
            "increment": () =>
              set((state) =>
                ({ "count": state.count + 1, })),
          })
      ));

    expect(getState().count).toBe(0);

    getState().increment();

    expect(getState().count).toBe(1);
  });

  it("Writes to the Yjs store.", () =>
  {
    type Store =
    {
      count: number,
      increment: () => void,
    };

    const doc = new Y.Doc();
    const storeName = "store";

    const { getState, } =
      create<Store>(yjs(
        doc,
        storeName,
        (set) =>
          ({
            "count": 0,
            "increment": () =>
              set((state) =>
                ({ "count": state.count + 1, })),
          })
      ));

    expect(getState().count).toBe(0);
    expect(doc.getMap(storeName).get("count")).toBe(0);

    getState().increment();

    expect(getState().count).toBe(1);
    expect(doc.getMap(storeName).get("count")).toBe(1);
  });

  it("Receives changes from peers.", () =>
  {
    type Store =
    {
      count: number,
      increment: () => void,
    };

    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    doc1.on("update", (update: any) =>
    {
      Y.applyUpdate(doc2, update);
    });
    doc2.on("update", (update: any) =>
    {
      Y.applyUpdate(doc1, update);
    });

    const storeName = "store";

    const { "getState": getStateA, } =
      create<Store>(yjs(
        doc1,
        storeName,
        (set) =>
          ({
            "count": 0,
            "increment": () =>
              set((state) =>
                ({ "count": state.count + 1, })),
          })
      ));

    const { "getState": getStateB, } =
      create<Store>(yjs(
        doc2,
        storeName,
        (set) =>
          ({
            "count": 0,
            "increment": () =>
              set((state) =>
                ({ "count": state.count + 1, })),
          })
      ));

    expect(getStateA().count).toBe(0);
    expect(getStateB().count).toBe(0);

    getStateA().increment();

    expect(getStateA().count).toBe(1);
    expect(getStateB().count).toBe(1);
  });

  it("Performs nested updates.", () =>
  {
    type Store =
    {
      person: {
        age: number,
      },
      getOlder: () => void,
    };

    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    doc1.on("update", (update: any) =>
    {
      Y.applyUpdate(doc2, update);
    });
    doc2.on("update", (update: any) =>
    {
      Y.applyUpdate(doc1, update);
    });

    const storeName = "store";

    const { getState, } =
      create<Store>(yjs(
        doc1,
        storeName,
        (set) =>
          ({
            "person": {
              "age": 0,
              "name": "Joe",
            },
            "getOlder": () =>
              set((state) =>
                ({
                  "person": { ...state.person, "age": state.person.age + 1, },
                })),
          })
      ));

    const peerStore = doc2.getMap(storeName);

    expect(getState().person.age).toBe(0);
    expect(peerStore.get("person").get("age")).toBe(0);

    getState().getOlder();

    expect(getState().person.age).toBe(1);
    expect(peerStore.get("person").get("age")).toBe(1);
  });

  it("Performs deep nested updates.", () =>
  {
    type Store =
    {
      owner: {
        person: {
          age: number,
          name: string,
        },
      },
      getOlder: () => void,
    };

    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    doc1.on("update", (update: any) =>
    {
      Y.applyUpdate(doc2, update);
    });
    doc2.on("update", (update: any) =>
    {
      Y.applyUpdate(doc1, update);
    });

    const storeName = "store";

    const { getState, } =
      create<Store>(yjs(
        doc1,
        storeName,
        (set) =>
          ({
            "owner": {
              "person": {
                "age": 0,
                "name": "Joe",
              },
            },
            "getOlder": () =>
              set((state) =>
                ({
                  "owner": {
                    ...state.owner,
                    "person": {
                      ...state.owner.person,
                      "age": state.owner.person.age + 1,
                    },
                  },
                })),
          })
      ));

    const peerStore = doc2.getMap(storeName);

    expect(getState().owner.person.age).toBe(0);
    expect(peerStore.get("owner").get("person")
      .get("age")).toBe(0);

    getState().getOlder();

    expect(getState().owner.person.age).toBe(1);
    expect(peerStore.get("owner").get("person")
      .get("age")).toBe(1);
  });

  it("Updates arrays in objects.", () =>
  {
    type Store =
    {
      room: {
        users: string[]
      },
      join: (user: string) => void,
    };

    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    doc1.on("update", (update: any) =>
    {
      Y.applyUpdate(doc2, update);
    });
    doc2.on("update", (update: any) =>
    {
      Y.applyUpdate(doc1, update);
    });

    const storeName = "store";

    const { getState, } =
      create<Store>(yjs(
        doc1,
        storeName,
        (set) =>
          ({
            "room": {
              "users": [
                "amy",
                "sam",
                "harold"
              ],
            },
            "join": (user) =>
              set((state) =>
                ({
                  "room": {
                    ...state.room,
                    "users": [
                      ...state.room.users,
                      user
                    ],
                  },
                })),
          })
      ));

    const peerStore = doc2.getMap(storeName);

    expect(getState().room.users).toEqual([ "amy", "sam", "harold" ]);
    expect(peerStore.get("room").get("users")
      .toJSON()).toEqual([ "amy", "sam", "harold" ]);

    getState().join("bob");

    expect(getState().room.users).toEqual([ "amy", "sam", "harold", "bob" ]);
    expect(peerStore.get("room").get("users")
      .toJSON()).toEqual([ "amy", "sam", "harold", "bob" ]);
  });

  it("Updates objects in arrays.", () =>
  {
    type Store =
    {
      users: { name: string, status: "online" | "offline" }[],
      setStatus: (userName: string, status: "online" | "offline") => void,
    };

    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    doc1.on("update", (update: any) =>
    {
      Y.applyUpdate(doc2, update);
    });
    doc2.on("update", (update: any) =>
    {
      Y.applyUpdate(doc1, update);
    });

    const storeName = "store";

    const { getState, } =
      create<Store>(yjs(
        doc1,
        storeName,
        (set) =>
          ({
            "users": [
              {
                "name": "alice",
                "status": "offline",
              },
              {
                "name": "bob",
                "status": "offline",
              }
            ],
            "setStatus": (userName, status) =>
            {
              set((state) =>
                ({
                  ...state,
                  "users": [
                    ...state.users.filter(({ name, }) =>
                      name !== userName),
                    {
                      "name": userName,
                      "status": status,
                    }
                  ],
                }));
            },
          })
      ));

    const peerStore = doc2.getMap(storeName);

    expect(getState().users).toEqual([
      { "name": "alice", "status": "offline", },
      { "name": "bob", "status": "offline", }
    ]);
    expect(peerStore.get("users").toJSON()).toEqual([
      { "name": "alice", "status": "offline", },
      { "name": "bob", "status": "offline", }
    ]);

    getState().setStatus("bob", "online");

    expect(getState().users).toEqual([
      { "name": "alice", "status": "offline", },
      { "name": "bob", "status": "online", }
    ]);
    expect(peerStore.get("users").toJSON()).toEqual([
      { "name": "alice", "status": "offline", },
      { "name": "bob", "status": "online", }
    ]);
  });

  it("Does not reset state on join.", () =>
  {
    type Store =
    {
      count: number,
      increment: () => void,
    };

    const doc = new Y.Doc();
    doc.getMap("hello").set("count", 12);

    const api =
      create<Store>(yjs(
        doc,
        "hello",
        (set) =>
          ({
            "count": 0,
            "increment": () =>
              set((state) =>
                ({ "count": state.count + 1, })),
          })
      ));

    expect(api.getState().count).toBe(12);
  });

  describe("When adding consecutive entries into arrays", () =>
  {
    it("Does not throw when inserting multiple scalars into arrays.", () =>
    {
      type Store =
      {
        numbers: number[],
        addNumber: (n: number) => void,
      };

      const doc = new Y.Doc();

      const api =
        create<Store>(yjs(
          doc,
          "hello",
          (set) =>
            ({
              "numbers": [],
              "addNumber": (n) =>
                set((state) =>
                  ({
                    "numbers": [
                      ...state.numbers,
                      n
                    ],
                  })),
            })
        ));

      expect(api.getState().numbers).toEqual([]);

      expect(() =>
      {
        api.getState().addNumber(0);
        api.getState().addNumber(1);
      }).not.toThrow();
    });

    it("Does not throw when inserting multiple arrays into arrays.", () =>
    {
      type Store =
      {
        arrays: Array<any>[],
        addArray: (array: any[]) => void,
      };

      const doc = new Y.Doc();

      const api =
        create<Store>(yjs(
          doc,
          "hello",
          (set) =>
            ({
              "arrays": [],
              "addArray": (array) =>
                set((state) =>
                  ({
                    "arrays": [
                      ...state.arrays,
                      array
                    ],
                  })),
            })
        ));

      expect(api.getState().arrays).toEqual([]);

      expect(() =>
      {
        api.getState().addArray([ 1, 2, 3, 4 ]);
        api.getState().addArray([ "foo", "bar", "baz" ]);
      }).not.toThrow();
    });

    it("Does not throw when inserting multiple maps into arrays.", () =>
    {
      type Store =
      {
        users: { name: string, status: "online" | "offline" }[],
        addUser: (name: string, status: "online" | "offline") => void,
      };

      const doc = new Y.Doc();

      const api =
        create<Store>(yjs(
          doc,
          "hello",
          (set) =>
            ({
              "users": [],
              "addUser": (name, status) =>
                set((state) =>
                  ({
                    "users": [
                      ...state.users,
                      {
                        "name": name,
                        "status": status,
                      }
                    ],
                  })),
            })
        ));

      expect(api.getState().users).toEqual([]);

      expect(() =>
      {
        api.getState().addUser("alice", "offline");
        api.getState().addUser("bob", "offline");
      }).not.toThrow();
    });
  });
});

describe("Yjs middleware with network provider", () =>
{
  it("Does not reset state on second join.", async () =>
  {
    const address = "ws://localhost:1234";
    const roomName = "room";
    const mapName = "shared";

    type State =
    {
      count: number,
      increment: () => void,
    };

    const doc1 = new Y.Doc();
    const provider1 = new WebsocketProvider(
      address,
      roomName,
      doc1,
      {
        "WebSocketPolyfill": require("ws"),
      }
    );
    const store1 = create<State>(yjs(
      doc1,
      mapName,
      (set) =>
        ({
          "count": 0,
          "increment": () =>
            set((state) =>
              ({ "count": state.count + 1, })),
        })
    ));

    store1.getState().increment();

    expect(store1.getState().count).toBe(1);

    const doc2 = new Y.Doc();
    const provider2 = new WebsocketProvider(
      address,
      roomName,
      doc2,
      {
        "WebSocketPolyfill": require("ws"),
      }
    );
    const store2 = create<State>(yjs(
      doc2,
      mapName,
      (set) =>
        ({
          "count": 0,
          "increment": () =>
            set((state) =>
              ({ "count": state.count + 1, })),
        })
    ));

    await new Promise<void>((resolve) =>
      setTimeout(
        () =>
          resolve(),
        25
      ));

    expect(store1.getState().count).toBe(1);
    expect(store2.getState().count).toBe(1);

    store1.getState().increment();

    await new Promise<void>((resolve) =>
      setTimeout(
        () =>
          resolve(),
        25
      ));

    expect(store1.getState().count).toBe(2);
    expect(store2.getState().count).toBe(2);

    provider1.destroy();
    provider2.destroy();
  });
});