import React from "react";
import { render, } from "@testing-library/react";
import "@testing-library/jest-dom";

describe("Yjs Middleware (react)", () =>
{
  it("Shares state between two documents with React.", () =>
  {
    const { getByTestId, } =
      render(<button data-testid="counter">Count: 0</button>);

    expect(getByTestId("counter")).toHaveTextContent("Count: 0");
  });
});