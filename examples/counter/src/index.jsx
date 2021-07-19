/* globals document */

import React, { useState } from "react";
import { render, } from "react-dom";

import * as Y from "yjs";
import { WebrtcProvider, } from "y-webrtc";

import create from "zustand";
import yjs from "zustand-middleware-yjs";

const doc = new Y.Doc();
new WebrtcProvider("counter-room", doc);

const useStore = create(yjs(doc, "shared",
  (set) =>
  ({
    "count": 0,
    "increment": () => set((state) =>
      ({
        ...state,
        "count": state.count + 1,
      })),
  })));

const App = () =>
{
  const { count, increment } = useStore((state) => ({
    "count": state.count,
    "increment": state.increment,
  }));

  return (
    <>
      <p>Count: {count}</p>
      <button onClick={increment}>To the Moon!</button>
    </>
  );
};

render(
  <App />,
  document.getElementById("app-root")
);