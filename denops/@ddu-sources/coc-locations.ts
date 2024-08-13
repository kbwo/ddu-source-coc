import { Denops } from "jsr:@denops/core@^7.0.0/type";
import { globals } from "https://jsr.io/@denops/std/7.0.0/variable/variable.ts";
import { fn } from "https://jsr.io/@shougo/ddu-vim/5.0.0/denops/ddu/deps.ts";
import { SourceOptions, BaseSource, Item } from "jsr:@shougo/ddu-vim/types";
import { ActionData } from "./types.ts";

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
        const currentWorkingDir = (await fn.getcwd(denops)) as string;
        const items: Item<ActionData>[] = cocJumpLocations.map((l) => {
          const pathText = l.filename.includes(currentWorkingDir)
            ? l.filename.replace(currentWorkingDir, "")
            : l.filename;
          return {
            word: pathText,
            display: `${pathText}:${l.lnum}:${l.col} ${l.text}`,
            action: {
              path: l.filename,
              col: l.col,
              lineNr: l.lnum,
            },
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
