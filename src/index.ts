import {
  State,
  StateCreator,
  SetState,
  GetState,
  StoreApi,
} from "zustand/vanilla";
import * as Y from "yjs";
import { patchSharedType, patchStore, } from "./patching";

/**
 * This function is the middleware the sets up the Zustand store to mirror state
 * into a Yjs store for peer-to-peer synchronization.
 *
 * @param doc The Yjs document to create the store in.
 * @param name The name that the store should be listed under in the doc.
 * @param config The initial state of the store we should be using.
 * @returns A Zustand state creator.
 */
export const yjs = <S extends State>(
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
    const initialState = config(
      (partial, replace) =>
      {
        set(partial, replace);
        patchSharedType(map, get());
      },
      get,
      {
        ...api,
        "setState": (partial, replace) =>
        {
          api.setState(partial, replace);
          patchSharedType(map, get());
        },
      }
    );

    // Initialize the Yjs store.
    patchSharedType(map, initialState);

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