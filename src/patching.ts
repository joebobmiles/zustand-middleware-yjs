import { diff, } from "json-diff";

export type Change = [
  "add" | "update" | "delete" | "pending",
  string | number,
  any
];

export const getChangeList = (a: any, b: any): Change[] =>
{
  const delta = diff(a, b);

  if (delta instanceof Array)
  {
    const patch: Change[] = [];

    let offset = 0;

    delta.forEach(([ type, value ], index) =>
    {
      switch (type)
      {
      case "+":
        if (0 < patch.length && patch[patch.length-1][0] === "delete") offset--;
        patch.push([ "add", index + offset, value ]);
        break;

      case "-":
        patch.push([ "delete", index + offset, undefined ]);
        break;

      case "~":
        patch.push([ "pending", index + offset, undefined ]);
        break;

      default:
        break;
      }
    });

    return patch;
  }
  else if (delta instanceof Object)
  {
    const patch: Change[] = [];

    (Object.entries(delta) as [ string, any ]).forEach(([ property, value ]) =>
    {
      if (property.match(/__added$/))
        patch.push([ "add", property.replace(/__added$/, ""), value ]);

      else if (property.match(/__deleted$/))
        patch.push([ "delete", property.replace(/__deleted$/, ""), undefined ]);

      else if (value.__old !== undefined && value.__new !== undefined)
        patch.push([ "update", property, value.__new ]);

      else if (value instanceof Object)
        patch.push([ "pending", property, undefined ]);
    });

    return patch;
  }
  else
    return [];
};