import { Denops } from "jsr:@denops/core@^7.0.0/type";
import { SourceOptions, BaseSource, Item } from "jsr:@shougo/ddu-vim/types";
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

  gather({ sourceParams, denops }: Args): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const cocSymbols = (await denops.call(
          "CocAction",
          "documentSymbols"
        )) as SymbolData[];
        const blank = "    ";
        const currentFullPath = (await denops.call("expand", "%:p")) as string;
        const items: Item<ActionData>[] = cocSymbols.map((l) => {
          return {
            word: `${l.lnum}:${l.kind}${blank}${l.text}`,
            action: {
              path: currentFullPath,
              col: l.col,
              text: l.text,
              lineNr: l.lnum,
            },
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
