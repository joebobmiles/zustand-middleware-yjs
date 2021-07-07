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

    expect(getState().counter).toBe(0);

    getState().increment();

    expect(getState().counter).toBe(1);
  });
});