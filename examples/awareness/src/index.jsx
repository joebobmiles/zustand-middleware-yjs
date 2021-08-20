/* globals document */
import React from "react";
import { render, } from "react-dom";

import * as Y from "yjs";
import { WebrtcProvider, } from "y-webrtc";

import Generator from "do-usernames";

const doc = new Y.Doc();
const provider = new WebrtcProvider("awareness-demo-room", doc);

const useAwareness = () =>
{
  const awareness = React.useRef(provider.awareness);

  const [ localState, setLocalState ] = React.useState({});

  const [ states, setStates ] = React.useState({});

  awareness.current.on("change", () =>
  {
    setStates(Object.fromEntries(awareness.current.getStates().entries()));
  });

  return {
    "clientId": awareness.current.clientId,

    "localState": localState,
    "setLocalState": (newState) =>
    {
      setLocalState(newState);

      awareness.current.setLocalState(typeof newState === "function"
        ? newState(localState)
        : newState);
    },

    "states": states,
  };
};

const App = () =>
{
  const { setLocalState, states, } = useAwareness();

  React.useEffect(
    () =>
    {
      const generator = new Generator({
        "colors": [
          "Aqua",
          "Aquamarine",
          "BlueViolet",
          "Coral",
          "DarkSlateBlue",
          "DeepPink",
          "DarkTurquoise",
          "MediumSpringGreen",
          "MediumTurquoise",
          "MidnightBlue",
          "RoyalBlue",
          "Salmon",
          "SlateBlue",
          "Turquoise",
          "Teal"
        ],
      });
      const colors = generator.getColors();

      setLocalState({
        "name": generator.getName(),
        "color": colors[Math.floor(Math.random() * colors.length)],
      });
    },
    []
  );

  return (
    <ul>
      {
        Object.entries(states).map(([ clientId, state ]) =>
          (
            <li
              key={clientId}
              style={{ "color": state.color, }}
            >
              {state.name}
            </li>
          ))
      }
    </ul>
  );
};

render(
  <App />,
  document.getElementById("app-root")
);