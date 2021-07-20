import create from "zustand/vanilla";
import * as Y from "yjs";
import yjs from ".";

describe("Yjs middleware (vanilla)", () =>
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
            "count": 0,
            "increment": () =>
              set((state) =>
                ({ "count": state.count + 1, })),
          })
      ));

    const peerStore = doc2.getMap(storeName);

    expect(getState().count).toBe(0);
    expect(peerStore.get("count")).toBe(0);

    getState().increment();

    expect(getState().count).toBe(1);
    expect(peerStore.get("count")).toBe(1);
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

    const { getState, } =
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

    const peerStore = doc2.getMap(storeName);

    expect(getState().count).toBe(0);
    expect(peerStore.get("count")).toBe(0);

    peerStore.set("count", 12);

    expect(getState().count).toBe(12);
    expect(peerStore.get("count")).toBe(12);
  });

  it("Does not send peer stores functions.", () =>
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

    const { getState, } =
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

    const peerStore = doc2.getMap(storeName);

    expect(getState().increment).not.toBeUndefined();
    expect(peerStore.get("increment")).toBeUndefined();
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
});