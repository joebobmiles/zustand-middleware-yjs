import * as Y from "yjs";
import { diff, } from "json-diff";
import { arrayToYArray, objectToYMap, } from "./mapping";
import { State, StoreApi, } from "zustand/vanilla";

export type Change = [
  "add" | "update" | "delete" | "pending" | "none",
  string | number,
  any
];

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const getChangeList = (a: any, b: any): Change[] =>
{
  const delta = diff(a, b);
  const changes: Change[] = [];

  if (delta instanceof Array)
  {
    let offset = 0;

    delta.forEach(([ type, value ], index) =>
    {
      switch (type)
      {
      case "+":
        if (0 < changes.length && changes[changes.length-1][0] === "delete")
          offset--;

        changes.push([ "add", index + offset, value ]);

        break;

      case "-":
        changes.push([ "delete", index + offset, undefined ]);
        break;

      case "~":
        changes.push([ "pending", index + offset, undefined ]);
        break;

      case " ":
      default:
        changes.push([ "none", index + offset, value ]);
        break;
      }
    });
  }
  else if (delta instanceof Object)
  {
    (Object.entries({ ...a, ...delta, }) as [ string, any ])
      .forEach(([ property, value ]) =>
      {
        if (property.match(/__added$/))
          changes.push([ "add", property.replace(/__added$/, ""), value ]);

        else if (property.match(/__deleted$/))
          changes.push([ "delete", property.replace(/__deleted$/, ""), undefined ]);

        else if (value.__old !== undefined && value.__new !== undefined)
          changes.push([ "update", property, value.__new ]);

        else if (value instanceof Object)
          changes.push([ "pending", property, undefined ]);

        else
          changes.push([ "none", property, value ]);
      });
  }

  return changes;
};

export const patchSharedType = (
  sharedType: Y.Map<any> | Y.Array<any>,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  newState: any
): void =>
{
  const changes = getChangeList(sharedType.toJSON(), newState);

  changes.forEach(([ type, property, value ]) =>
  {
    switch (type)
    {
    case "add":
    case "update":
      if (sharedType instanceof Y.Map)
        sharedType.set(property as string, value);

      else if (sharedType instanceof Y.Array)
      {
        const index = property as number;

        const left = sharedType.slice(0, index);
        const right = sharedType.slice(index+1);

        sharedType.delete(0, sharedType.length);

        if (value instanceof Array)
        {
          sharedType.insert(0, [
            ...left,
            arrayToYArray(value),
            ...right
          ]);
        }
        else if (value instanceof Object)
        {
          sharedType.insert(0, [
            ...left,
            objectToYMap(value),
            ...right
          ]);
        }
        else
          sharedType.insert(0, [ ...left, value, ...right ]);
      }

      break;

    case "delete":
      if (sharedType instanceof Y.Map)
        sharedType.delete(property as string);

      else if (sharedType instanceof Y.Array)
        sharedType.delete(property as number, 1);

      break;

    case "pending":
      if (sharedType instanceof Y.Map)
      {
        patchSharedType(
          sharedType.get(property as string),
          newState[property as string]
        );
      }
      break;

    default:
      break;
    }
  });
};

export const patchStore = <S extends State>(
  store: StoreApi<S>,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  newState: any
): void =>
{
  const patch = (oldState: any, newState: any): any =>
  {
    const changes = getChangeList(oldState, newState);

    changes.forEach(([ type, property, value ]) =>
    {
      switch (type)
      {
      case "add":
      case "update":
        {
          store.setState((state) =>
            ({
              ...state,
              [property]: value,
            }));
        } break;

      case "delete":
        {
          store.setState((state) =>
          {
            delete (state as any)[property as string];
            return state;
          });
        } break;

      case "pending":
        {
          store.setState((state) =>
            ({
              ...state,
              [property]: patch(
                (store.getState() as any)[property as string],
                newState[property as string]
              ),
            }));
        } break;

      default:
      }
    });
  };

  patch(store.getState(), newState);
};