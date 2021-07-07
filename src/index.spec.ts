import create from "zustand/vanilla";
import * as Y from "yjs";
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

    const { getState } =
      create<Store>(
        yjs(
          new Y.Doc(),
          "hello",
          (set) => ({
            count: 0,
            increment: () => set((state) => ({ count: state.count + 1 })),
          })
        )
      );

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

    doc1.on('update', (update: any) =>
    {
      Y.applyUpdate(doc2, update);
    });
    doc2.on('update', (update: any) =>
    {
      Y.applyUpdate(doc1, update);
    });

    const storeName = "store";

    const { getState } =
      create<Store>(
        yjs(
          doc1,
          storeName,
          (set) => ({
            count: 0,
            increment: () => set((state) => ({ count: state.count + 1 })),
          })
        )
      );

    const peerStore = doc2.getMap(storeName);

    expect(getState().count).toBe(0);
    expect(peerStore.get("count")).toBe(0);

    getState().increment();

    expect(getState().count).toBe(1);
    expect(peerStore.get("count")).toBe(1);
  });
});