import { Denops } from "jsr:@denops/core@^7.0.0/type";
import {
  SourceOptions,
  Item,
  ItemHighlight,
} from "jsr:@shougo/ddu-vim@~6.1.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~6.1.0/source";
import { ActionData } from "./types.ts";

type Params = {
  symbols: SymbolData[];
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

type SymbolData = {
  col: number;
  lnum: number;
  range: {
    end: RangeData;
    start: RangeData;
  };
  selectionRange: {
    end: RangeData;
    start: RangeData;
  };
  level: number;
  kind: string;
  start: RangeData;
  text: string;
};

export class Source extends BaseSource<Params> {
  kind = "file";

  gather({ denops }: Args): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const cocSymbols = (await denops.call(
          "CocAction",
          "documentSymbols"
        )) as SymbolData[];
        const currentFullPath = (await denops.call("expand", "%:p")) as string;
        const items: Item<ActionData>[] = cocSymbols.map((s) => {
          const contents = s.text.replace(/^\s+/, "");
          const prefix = `${s.lnum}:${s.kind}`;
          return {
            word: `${prefix} ${contents}`,
            action: {
              path: currentFullPath,
              col: s.col,
              text: s.text,
              lineNr: s.lnum,
            },
            highlights: [
              {
                name: "RelativePath",
                hl_group: "CocListPath",
                col: 1,
                width: prefix.length + 1,
              },
            ] as ItemHighlight[],
          };
        });
        if (items.length) {
          controller.enqueue(items);
        }
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
