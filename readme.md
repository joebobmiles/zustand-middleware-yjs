# Yjs Middleware for Zustand

> **This project is currently in a minimum-viable product (MVP) state.**
> Consider the current state to be pre-alpha and expect a wealth of bugs. I will
> be undertaking a major rewrite of this library to lock in requirements,
> functionality, and scope.

One of the difficult things about using Yjs is that it's not easily integrated
with modern state management libraries in React. This middleware for Zustand
solves that problem by allowing a Zustand store to be turned into a CRDT, with
the store's state replicated to all peers.

This differs from the other Yjs and Zustand solution, `zustand-yjs` by allowing
any Zustand store be turned into a CRDT. This contrasts with `zustand-yjs`'s solution, which uses a Zustand store to collect shared types and access them
through special hooks.

Because this solution is simply a middleware, it can also work anywhere Zustand
can be used. The vanilla Zustand `create()` function handles middleware exactly
the same as the React version. And not only that, but it can be composed with
other middleware, such as Immer or Redux!

## Example

```ts-react
import React from "react";
import { render } from "react-dom";

import * as Y from "yjs";
import create from "zustand";
import yjs from "zustand-middleware-yjs";

// Create a Y Doc to place our store in.
const ydoc = new Y.Doc();

// Create the Zustand store.
const useSharedStore = create(
    // Wrap the store creator with the Yjs middleware.
    yjs(
        // Provide the Y Doc and the name of the shared type that will be used
        // to hold the store.
        ydoc, "shared",
        
        // Create the store as you would normally.
        (set) =>
        ({
            count: 0,
            increment: set(
                (state) =>
                ({
                    count: state.count + 1,
                })
            ),
        })
    )
);

// Use the shared store like you normally would any other Zustand store.
const App = () =>
{
    const { count, increment } = useSharedState((state) => {
        count: state.count, increment: state.increment
    });

    return (
        <>
            <p>count: {count}</p>
            <button onClick={() => increment()}>+</button>
        </>
    )
};

render(
    <App />,
    document.getElementById("app-root")
);
```

## Caveats

 1. **This project is currently in a minimum-viable product (MVP) state.**
    Consider the current state to be pre-alpha and expect a wealth of bugs.
    I will be undertaking a major rewrite of this library to lock in
    requirements, functionality, and scope.
 1. Currently the Y Text shared type is not supported. This means that strings
    in the store do not benefit from the conflict-resolution performed by Yjs.
 1. The Yjs awareness protocol is not supported. At the moment, it is unclear
    if the library is able to support Yjs protocols. This means that, for now,
    support for the awareness protocol is not planned.