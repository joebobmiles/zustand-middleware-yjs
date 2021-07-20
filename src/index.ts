import {
  State,
  StateCreator,
  SetState,
  GetState,
  StoreApi,
} from "zustand/vanilla";
import * as Y from "yjs";
import { patchObject, patchSharedType, patchStore, } from "./patching";

/**
 * This function is the middleware the sets up the Zustand store to mirror state
 * into a Yjs store for peer-to-peer synchronization.
 *
 * @example <caption>Using yjs</caption>
 * const useState = create(
 *   yjs(
 *     new Y.Doc(), // A Y.Doc to back our store with.
 *     "shared",    // A name to give the Y.Map our store is backed by.
 *     (set) =>
 *     ({
 *       "count": 1,
 *     })
 *   )
 * );
 *
 * @param doc The Yjs document to create the store in.
 * @param name The name that the store should be listed under in the doc.
 * @param config The initial state of the store we should be using.
 * @returns A Zustand state creator.
 */
const yjs = <S extends State>(
  doc: Y.Doc,
  name: string,
  config: StateCreator<S>
): StateCreator<S> =>
{
  // The root Y.Map that the store is written and read from.
  const map: Y.Map<any> = doc.getMap(name);

  // Augment the store.
  return (set: SetState<S>, get: GetState<S>, api: StoreApi<S>): S =>
  {
    /*
     * Capture the initial state so that we can initialize the Yjs store to the
     * same values as the initial values of the Zustand store.
     */
    let initialState = config(
      /*
       * Create a new set function that defers to the original and then passes
       * the new state to patchSharedType.
       */
      (partial, replace) =>
      {
        set(partial, replace);
        patchSharedType(map, get());
      },
      get,
      {
        ...api,
        // Create a new setState function as we did with set.
        "setState": (partial, replace) =>
        {
          api.setState(partial, replace);
          patchSharedType(map, api.getState());
        },
      }
    );

    // Initialize the Yjs store.
    if (Array.from(map.keys()).length === 0)
      patchSharedType(map, initialState);

    else
      initialState = patchObject(initialState, map.toJSON());

    /*
     * Whenever the Yjs store changes, we perform a set operation on the local
     * Zustand store. We avoid using the Yjs enabled set to prevent unnecessary
     * ping-pong of updates.
     */
    map.observeDeep(() =>
    {
      patchStore(api, map.toJSON());
    });

    // Return the initial state to create or the next middleware.
    return initialState;
  };
};

export default yjs;
