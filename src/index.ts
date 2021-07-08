import { State, StateCreator, SetState, GetState, StoreApi } from "zustand/vanilla";
import * as Y from "yjs";
import { diff } from "json-diff";

const arrayToYarray = (array: Array<any>): Y.Array<any> =>
{
  const yarray = new Y.Array();

  for (const value of array)
  {
    if (typeof value !== 'function' && typeof value !== 'undefined')
    {
      if (value instanceof Array)
      {
        yarray.push([ arrayToYarray(value) ]);
      }
      else if (value instanceof Object)
      {
        yarray.push([ stateToYmap(value) ]);
      }
      else
      {
        yarray.push([ value ]);
      }
    }
  }

  return yarray;
}

const stateToYmap = <S extends State>(state: S, ymap = new Y.Map()) =>
{
  for (const property in state)
  {
    if (typeof state[property] !== 'function' && typeof state[property] !== 'undefined')
    {
      if (state[property] instanceof Array)
      {
        ymap.set(property, arrayToYarray((<unknown>state[property]) as Array<any>));
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

const mapZustandUpdateToYjsUpdate =
  (stateDiff: any, ymap: Y.Map<any>) =>
  {
    const getChange = (property: string, value: any): [
      "add" | "delete" | "update" | "none",
      string,
      any
    ] =>
    {
      if (isNaN(parseInt(property, 10)) == false)
      {
        switch (value[0])
        {
          case "+":
            return [ "add", property, value ];

          case "-":
            return [ "delete", property, undefined ];

          default:
            return [ "none", property, value ];
        }
      }
      else
      {
        if (property.match(/__added$/))
          return [ "add", property.replace(/__added$/, ""), value ];

        else if (property.match(/__deleted$/))
          return [ "delete", property.replace(/__deleted$/, ""), undefined ];

        else if (value.__old !== undefined && value.__new !== undefined)
          return [ "update", property, value.__new ];

        else
          return [ "none", property, value ];
      }
    }

    for (const property in stateDiff)
    {
      const value = stateDiff[property];

      if (typeof value !== 'function' && typeof value !== 'undefined')
      {
        const [ type, actualProperty, newValue ] = getChange(property, value);

        if (typeof newValue !== 'function' && typeof newValue !== 'undefined')
        {
          switch (type)
          {
            case "delete":
              // TODO
              break;

            case "add":
            case "update":
              {
                // TODO
                if (newValue instanceof Object)
                  return;

                else
                  ymap.set(actualProperty, newValue);
              }
              break;

            case "none":
            default:
              {
                if (newValue instanceof Object)
                  mapZustandUpdateToYjsUpdate(
                    newValue,
                    ymap.get(actualProperty)
                  );
              }
              break;
          }
        }
      }
    }
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

      mapZustandUpdateToYjsUpdate(diff(previousState, nextState), map);
    };

    // The new get function.
    const get: GetState<S> = () => _get();

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
              set(() =>
              {
                const value = map.get(key);

                if (value instanceof Y.Array)
                  return <unknown>{ [key]: (value as Y.Array<any>).toJSON() };

                else if (value instanceof Y.Map)
                  return <unknown>{ [key]: (value as Y.Map<any>).toJSON() };

                else
                  return <unknown>{ [key]: value };
              });
              break;

            case 'delete':
            default:
              break;
          }
        });
      }
    });

    // Return the initial state to create or the next middleware.
    return initialState;
  };
};

export default yjs;