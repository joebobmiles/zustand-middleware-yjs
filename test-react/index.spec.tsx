import React from "react";
import { fireEvent, render, } from "@testing-library/react";
import "@testing-library/jest-dom";

import create from "zustand";
import * as Y from "yjs";

import yjs from "../src";

describe("Yjs Middleware (react)", () =>
{
  it("Shares state between two documents with React.", () =>
  {
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

    type State =
    {
      "count": number,
      "increment": () => void,
    };
    const useStore = create<State>(yjs(doc1, "shared", (set) =>
      ({
        "count": 0,
        "increment": () =>
          set((state) =>
            ({ ...state, "count": state.count + 1, })),
      })));

    const Counter = () =>
    {
      const { count, increment, } = useStore((state) =>
        ({
          "count": state.count,
          "increment": state.increment,
        }));

      return (
        <button
          data-testid="counter"
          onClick={increment}
        >
          Count: {count}
        </button>
      );
    };

    const { getByTestId, } =
      render(<Counter />);

    expect(getByTestId("counter")).toHaveTextContent("Count: 0");
    expect(doc2.getMap("shared").get("count")).toBe(0);

    fireEvent.click(getByTestId("counter"));

    expect(getByTestId("counter")).toHaveTextContent("Count: 1");
    expect(doc2.getMap("shared").get("count")).toBe(1);
  });
});