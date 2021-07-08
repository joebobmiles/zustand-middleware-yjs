import { State, StateCreator, SetState, GetState, StoreApi } from "zustand/vanilla";
import * as Y from "yjs";
import { diff } from "json-diff";

const stateToYmap = <S extends State>(state: S, ymap = new Y.Map()) =>
{
  for (const property in state)
  {
    if (typeof state[property] !== 'function' && typeof state[property] !== 'undefined')
    {
      if (state[property] instanceof Array)
      {
        // TODO
      }

      else if (state[property] instanceof Object)
      {
        ymap.set(property, stateToYmap((<unknown>state[property]) as object));
      }

      else
      {
        ymap.set(property, state[property]);
      }
    }
  }
  
  return ymap;
};

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
) =>
{
  // The root Y.Map that the store is written and read from.
  const map: Y.Map<any> = doc.getMap(name);

  // Augment the store.
  return (_set: SetState<S>, _get: GetState<S>, _api: StoreApi<S>): S =>
  {
    // The new set function.
    const set: SetState<S> = (partial, replace) =>
    {
      const previousState = _get();
      _set(partial, replace);
      const nextState = _get();

      const stateDiff = diff(previousState, nextState);

      if (stateDiff !== undefined)
      {
        for (const property in stateDiff)
        {
          if (
            stateDiff[property] !== undefined &&
            stateDiff[property].__old !== undefined &&
            stateDiff[property].__new !== undefined &&
            typeof (nextState as any)[property] !== 'function'
          )
            map.set(property, stateDiff[property].__new);
        }
      }
    };

    // The new get function.
    const get: GetState<S> = () => _get();

    // Whenever the Yjs store changes, we perform a set operation on the local
    // Zustand store. We avoid using the Yjs enabled set to prevent unnecessary
    // ping-pong of updates.
    map.observe((event) =>
    {
      if (event.target === map)
      {
        event.changes.keys.forEach((change, key) =>
        {
          switch (change.action)
          {
            case 'add':
            case 'update':
              set(() => <unknown>({ [key]: map.get(key) }));
              break;

            case 'delete':
            default:
              break;
          }
        });
      }
    });

    map.observeDeep((events) =>
    {
      events.forEach((event) =>
      {
        console.log(event.path);
      });
    });

    // Capture the initial state so that we can initialize the Yjs store to the
    // same values as the initial values of the Zustand store.
    const initialState = config(
      set,
      get,
      {
        ..._api,
        setState: set,
        getState: get,
      }
    );

    // Initialize the Yjs store.
    stateToYmap(initialState, map);

    // Return the initial state to create or the next middleware.
    return initialState;
  };
};

export default yjs;