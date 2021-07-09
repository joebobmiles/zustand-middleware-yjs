import { diff, } from "json-diff";

export type Change = [ "add" | "update" | "delete" | "pending", string, any ];

export const getChangeList = (a: any, b: any): Change[] =>
{
  const delta = diff(a, b);

  if (delta instanceof Object)
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