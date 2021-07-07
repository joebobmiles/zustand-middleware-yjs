import * as Y from "yjs";
import { State, StateCreator, SetState, GetState, StoreApi } from "zustand/vanilla";

export const yjs = <S extends State>(
  doc: Y.Doc,
  name: string,
  config: StateCreator<S>
) =>
{
  // The root Y.Map that the store is written and read from.
  const map: Y.Map<any> = doc.getMap(name);

  return (_set: SetState<S>, _get: GetState<S>, _api: StoreApi<S>) =>
  {
    const set: SetState<S> = (partial, replace) =>
    {
      _set(partial, replace)
    };

    const get: GetState<S> = () => _get();

    return config(
      set,
      get,
      {
        ..._api,
        setState: set,
        getState: get,
      }
    );
  };
};

export default yjs;