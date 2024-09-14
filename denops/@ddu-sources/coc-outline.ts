import { Denops } from "jsr:@denops/core@^7.0.0/type";
import { SourceOptions, Item } from "jsr:@shougo/ddu-vim@~6.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~6.1.0/source";
import { ActionData } from "./types.ts";
import { globals } from "https://jsr.io/@denops/std/7.0.0/variable/variable.ts";

type Params = {
  symbols: FullSymbolData[];
  filePath: string;
};

type Args = {
  denops: Denops;
  sourceOptions: SourceOptions;
  sourceParams: Params;
};

type RangeData = {
  character: number;
  line: number;
};

type FullSymbolData = {
  name: string;
  kind: number;
  range: {
    end: RangeData;
    start: RangeData;
  };
  selectionRange: {
    end: RangeData;
    start: RangeData;
  };
  children?: FullSymbolData[];
};
// export declare namespace SymbolKind {
//     const File: 1;
//     const Module: 2;
//     const Namespace: 3;
//     const Package: 4;
//     const Class: 5;
//     const Method: 6;
//     const Property: 7;
//     const Field: 8;
//     const Constructor: 9;
//     const Enum: 10;
//     const Interface: 11;
//     const Function: 12;
//     const Variable: 13;
//     const Constant: 14;
//     const String: 15;
//     const Number: 16;
//     const Boolean: 17;
//     const Array: 18;
//     const Object: 19;
//     const Key: 20;
//     const Null: 21;
//     const EnumMember: 22;
//     const Struct: 23;
//     const Event: 24;
//     const Operator: 25;
//     const TypeParameter: 26;
// }

const SYMBOL_KINDS = new Map<number, string>([
  [1, "File"],
  [2, "Module"],
  [3, "Namespace"],
  [4, "Package"],
  [5, "Class"],
  [6, "Method"],
  [7, "Property"],
  [8, "Field"],
  [9, "Constructor"],
  [10, "Enum"],
  [11, "Interface"],
  [12, "Function"],
  [13, "Variable"],
  [14, "Constant"],
  [15, "String"],
  [16, "Number"],
  [17, "Boolean"],
  [18, "Array"],
  [19, "Object"],
  [20, "Key"],
  [21, "Null"],
  [22, "EnumMember"],
  [23, "Struct"],
  [24, "Event"],
  [25, "Operator"],
  [26, "TypeParameter"],
]);

export class Source extends BaseSource<Params> {
  kind = "file";

  gather({ denops }: Args): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const cocFullSymbols: FullSymbolData[] =
          JSON.parse(await globals.get(denops, "FullDocumentSymbols")) ?? [];
        const currentFullPath = (await denops.call("expand", "%:p")) as string;
        const items: Item<ActionData>[] = getItems(
          cocFullSymbols,
          currentFullPath
        );
        controller.enqueue(items);
        controller.close();
      },
    });
  }

  params(): Params {
    return {
      symbols: [],
      filePath: "",
    };
  }
}

const getItems = (
  symbols: FullSymbolData[],
  currentFullPath: string,
  treePath?: string
): Item<ActionData>[] => {
  return symbols.reduce((acc, o) => {
    const lnum = o.range.start.line + 1;
    const col = o.range.start.character + 1;
    const kind = SYMBOL_KINDS.get(o.kind) ?? "Unknown";
    const prefix = `${lnum}:${kind}`;
    const hasChildren = o.children && o.children.length > 0;
    const id = `${lnum}:${o.name}`;
    const currentTreePath = [treePath, id].join("/");
    acc = [
      ...acc,
      {
        word: `${prefix} ${o.name}`,
        action: {
          path: currentFullPath,
          col: col,
          lineNr: lnum,
        },
        treePath: hasChildren ? currentTreePath : undefined,
        isTree: hasChildren,
        isExpanded: hasChildren,
        level: currentTreePath.split("/").length - 2,
        highlights: [
          {
            name: "RelativePath",
            hl_group: "CocListPath",
            col: 1,
            width: prefix.length + 1,
          },
        ],
      },
    ];
    if (o.children) {
      acc = [...acc, ...getItems(o.children, currentFullPath, currentTreePath)];
    }
    return acc;
  }, [] as Item<ActionData>[]);
};
