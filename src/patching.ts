import * as Y from "yjs";
import { diff, } from "json-diff";

export type Change = [
  "add" | "update" | "delete" | "pending",
  string | number,
  any
];

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

      default:
        break;
      }
    });
  }
  else if (delta instanceof Object)
  {
    (Object.entries(delta) as [ string, any ]).forEach(([ property, value ]) =>
    {
      if (property.match(/__added$/))
        changes.push([ "add", property.replace(/__added$/, ""), value ]);

      else if (property.match(/__deleted$/))
        changes.push([ "delete", property.replace(/__deleted$/, ""), undefined ]);

      else if (value.__old !== undefined && value.__new !== undefined)
        changes.push([ "update", property, value.__new ]);

      else if (value instanceof Object)
        changes.push([ "pending", property, undefined ]);
    });
  }

  return changes;
};

export const patchSharedType = (
  sharedType: Y.Map<any> | Y.Array<any>,
  update: any
): any =>
{
  const changes = getChangeList(sharedType.toJSON(), update);

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
        sharedType.insert(0, [ ...left, value, ...right ]);
      }

      break;

    case "delete":
      if (sharedType instanceof Y.Map)
        sharedType.delete(property as string);

      break;

    case "pending":
      if (sharedType instanceof Y.Map)
      {
        patchSharedType(
          sharedType.get(property as string),
          update[property as string]
        );
      }
      break;

    default:
      break;
    }
  });
};