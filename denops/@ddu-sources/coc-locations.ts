import { Denops } from "jsr:@denops/core@^7.0.0/type";
import { globals } from "https://jsr.io/@denops/std/7.0.0/variable/variable.ts";
import { fn } from "https://jsr.io/@shougo/ddu-vim/5.0.0/denops/ddu/deps.ts";
import {
  SourceOptions,
  BaseSource,
  Item,
  ItemHighlight,
} from "jsr:@shougo/ddu-vim/types";
import { ActionData } from "./types.ts";
import { relative } from "jsr:@std/path@^1.0.2/relative";

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

type LocationData = {
  uri: string;
  lnum: number;
  end_lnum: number;
  range: {
    end: RangeData;
    start: RangeData;
  };
  filename: string;
  bufnr: number;
  end_col: number;
  col: number;
  text: string;
};

export class Source extends BaseSource<Params> {
  kind = "file";

  gather({ denops }: Args): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const cocJumpLocations: LocationData[] =
          (await globals.get(denops, "coc_jump_locations")) ?? [];
        const cwd = (await fn.getcwd(denops)) as string;
        const items: Item<ActionData>[] = cocJumpLocations.map((l) => {
          const pathText = relative(cwd, l.filename);
          const contents = l.text.replace(/^\s+/, "");
          const position = `${pathText}:${l.lnum}`;
          const word = `${position} ${contents}`;
          return {
            word,
            action: {
              path: l.filename,
              col: l.col,
              lineNr: l.lnum,
            },
            highlights: [
              {
                name: "RelativePath",
                hl_group: "CocListPath",
                col: 1,
                width: position.length + 1,
              },
            ] as ItemHighlight[],
          };
        });
        controller.enqueue(items);
        controller.close();
      },
    });
  }

  params(): Params {
    return {};
  }
}
