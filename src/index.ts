import { State, StateCreator, SetState, GetState, StoreApi } from "zustand/vanilla";
import * as Y from "yjs";
import { diff } from "json-diff";

export const yjs = <S extends State>(
  doc: Y.Doc,
  name: string,
  config: StateCreator<S>
) =>
{
  // The root Y.Map that the store is written and read from.
  const map: Y.Map<any> = doc.getMap(name);

  return (_set: SetState<S>, _get: GetState<S>, _api: StoreApi<S>): S =>
  {
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
            stateDiff[property].__new !== undefined
          )
            map.set(property, stateDiff[property].__new);
        }
      }
    };

    const get: GetState<S> = () => _get();

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

    const initialState = config(
      set,
      get,
      {
        ..._api,
        setState: set,
        getState: get,
      }
    );

    for (const property in initialState)
      if (typeof initialState[property] !== 'function')
        map.set(property, initialState[property]);

    return initialState;
  };
};

export default yjs;