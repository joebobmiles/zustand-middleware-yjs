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