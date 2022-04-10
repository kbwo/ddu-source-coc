import {
  BaseSource,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddu_vim@v1.2.0/types.ts";
import { Denops } from "https://deno.land/x/ddu_vim@v1.2.0/deps.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.2.0/file.ts";
import * as fn from "https://deno.land/x/denops_std@v3.1.4/function/mod.ts";

type Params = Record<never, never>;

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

  gather(
    { denops }: Args,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const cocSymbols: SymbolData[] = await denops.call(
          "CocAction",
          "documentSymbols",
        ) as SymbolData[];
        const blank = "   ";
        const currentFullPath = await fn.expand(denops, "%:p") as string;
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
    return {};
  }
}
