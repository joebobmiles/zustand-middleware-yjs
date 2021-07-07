import create from "zustand/vanilla";
import * as Y from "yjs";
import yjs from ".";

describe("Yjs middleware", () =>
{
  it("Creates a useState function.", () =>
  {
    type Store =
    {
      counter: number,
      increment: () => void,
    };

    const { getState } =
      create<Store>(
        yjs(
          new Y.Doc(),
          "hello",
          (set) => ({
            counter: 0,
            increment: () => set((state) => ({ counter: state.counter + 1 })),
          })
        )
      );

    const { counter } = getState();

    expect(counter).toBe(0);
  });
});