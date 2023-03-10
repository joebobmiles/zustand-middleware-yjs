import * as Y from "yjs";
import { ChangeType, } from "./types";
import { getChanges, } from "./diff";
import { arrayToYArray, objectToYMap, } from "./mapping";
import { State, StoreApi, } from "zustand/vanilla";

/**
 * Diffs sharedType and newState to create a list of changes for transforming
 * the contents of sharedType into that of newState. For every nested, 'pending'
 * change detected, this function recurses, as a nested object or array is
 * represented as a Y.Map or Y.Array.
 *
 * @param sharedType The Yjs shared type to patch.
 * @param newState The new state to patch the shared type into.
 */
export const patchSharedType = (
  sharedType: Y.Map<any> | Y.Array<any>,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  newState: any
): void =>
{
  const changes = getChanges(sharedType.toJSON(), newState);

  changes.forEach(([ type, property, value ]) =>
  {
    switch (type)
    {
    case ChangeType.INSERT:
    case ChangeType.UPDATE:
      if ((value instanceof Function) === false)
      {
        if (sharedType instanceof Y.Map)
        {
          if (value instanceof Array)
            sharedType.set(property as string, arrayToYArray(value));

          else if (value instanceof Object)
            sharedType.set(property as string, objectToYMap(value));

          else
            sharedType.set(property as string, value);
        }

        else if (sharedType instanceof Y.Array)
        {
          const index = property as number;

          if (type === ChangeType.UPDATE)
            sharedType.delete(index);

          if (value instanceof Array)
            sharedType.insert(index, [ arrayToYArray(value) ]);
          else if (value instanceof Object)
            sharedType.insert(index, [ objectToYMap(value) ]);
          else
            sharedType.insert(index, [ value ]);
        }
      }
      break;

    case ChangeType.DELETE:
      if (sharedType instanceof Y.Map)
        sharedType.delete(property as string);

      else if (sharedType instanceof Y.Array)
      {
        const index = property as number;
        sharedType.delete(sharedType.length <= index
          ? sharedType.length - 1
          : index);
      }

      break;

    case ChangeType.PENDING:
      if (sharedType instanceof Y.Map)
      {
        patchSharedType(
          sharedType.get(property as string),
          newState[property as string]
        );
      }
      else if (sharedType instanceof Y.Array)
      {
        patchSharedType(
          sharedType.get(property as number),
          newState[property as number]
        );
      }
      break;

    default:
      break;
    }
  });
};

/**
 * Patches oldState to be identical to newState. This function recurses when
 * an array or object is encountered. If oldState and newState are already
 * identical (indicated by an empty diff), then oldState is returned.
 *
 * @param oldState The state we want to patch.
 * @param newState The state we want oldState to match after patching.
 *
 * @returns The patched oldState, identical to newState.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const patchObject = (oldState: any, newState: any): any =>
{
  const changes = getChanges(oldState, newState);

  if (changes.length === 0)
    return oldState;

  else if (oldState instanceof Array)
  {
    const p: any = changes
      .sort(([ , indexA ], [ , indexB ]) =>
        Math.sign((indexA as number) - (indexB as number)))
      .reduce(
        (state, [ type, index, value ]) =>
        {
          switch (type)
          {
          case ChangeType.INSERT:
          case ChangeType.UPDATE:
          case ChangeType.NONE:
          {
            return [
              ...state,
              value
            ];
          }

          case ChangeType.PENDING:
          {
            return [
              ...state,
              patchObject(
                oldState[index as number],
                newState[index as number]
              )
            ];
          }

          case ChangeType.DELETE:
          default:
            return state;
          }
        },
        [] as any[]
      );

    return p;
  }

  else if (oldState instanceof Object)
  {
    const p: any = changes.reduce(
      (state, [ type, property, value ]) =>
      {
        switch (type)
        {
        case ChangeType.INSERT:
        case ChangeType.UPDATE:
        case ChangeType.NONE:
        {
          return {
            ...state,
            [property]: value,
          };
        }

        case ChangeType.PENDING:
        {
          return {
            ...state,
            [property]: patchObject(
              oldState[property as string],
              newState[property as string]
            ),
          };
        }

        case ChangeType.DELETE:
        default:
          return state;
        }
      },
      {}
    );

    return {
      ...Object.entries(oldState).reduce(
        (o, [ property, value ]) =>
          (
            value instanceof Function
              ? { ...o, [property]: value, }
              : o
          ),
        {}
      ),
      ...p,
    };
  }
};


/**
 * Diffs the current state stored in the Zustand store and the given newState.
 * The current Zustand state is patched into the given new state recursively.
 *
 * @param store The Zustand API that manages the store we want to patch.
 * @param newState The new state that the Zustand store should be patched to.
 */
export const patchStore = <S extends State>(
  store: StoreApi<S>,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  newState: any
): void =>
{
  store.setState(
    patchObject(store.getState() || {}, newState),
    true // Replace with the patched state.
  );
};