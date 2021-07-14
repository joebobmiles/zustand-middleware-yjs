/* globals document */

import React from "react";
import { render, } from "react-dom";

import * as Y from "yjs";
import { WebrtcProvider, } from "y-webrtc";

import create from "zustand";
import yjs from "zustand-middleware-yjs";

const doc = new Y.Doc();
new WebrtcProvider("counter-room", doc);

const useStore = create(yjs(doc, "shared", (set) =>
  ({
    "count": 1,
    "increment": set((state) =>
      state.count + 1),
  })));

render(
  <h1>Hello, World!</h1>,
  document.getElementById("app-root")
);