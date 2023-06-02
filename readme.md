# Yjs Middleware for Zustand

One of the difficult things about using Yjs is that it's not easily integrated
with modern state management libraries in React. This middleware for Zustand
solves that problem by allowing a Zustand store to be turned into a CRDT, with
the store's state replicated to all peers.

This differs from the other Yjs and Zustand solution, `zustand-yjs` by allowing
any Zustand store be turned into a CRDT. This contrasts with `zustand-yjs`'s
solution, which uses a Zustand store to collect shared types and access them
through special hooks.

Because this solution is simply a middleware, it can also work anywhere Zustand
can be used. The vanilla Zustand `create()` function handles middleware exactly
the same as the React version. And not only that, but it can be composed with
other middleware, such as Immer or Redux!

## Example

```tsx
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
        increment: () =>
          set(
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
  const { count, increment } = useSharedStore((state) =>
    ({
      count: state.count,
      increment: state.increment
    }));

  return (
    <>
      <p>count: {count}</p>
      <button onClick={() => increment()}>+</button>
    </>
  );
};

render(
  <App />,
  document.getElementById("app-root")
);
```

## Caveats

 1. The Yjs awareness protocol is not supported. At the moment, it is unclear
    if the library is able to support Yjs protocols. This means that, for now,
    support for the awareness protocol is not planned.
      * This does not mean you cannot use awareness in your projects - see the
        sister project [y-react](joebobmiles/y-react) for an example of using
        awareness without the middleware.

# License

This library is licensed under the MIT license:

> Copyright © 2021 Joseph R Miles
> 
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the “Software”), to deal 
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is 
> furnished to do so, subject to the following conditions:
> 
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
> 
> THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE. 