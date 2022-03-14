// deno-lint-ignore-file require-await camelcase
import {
  BaseSource,
  Item,
  SourceOptions,
} from "https://deno.land/x/ddu_vim@v1.2.0/types.ts";
import { Denops } from "https://deno.land/x/ddu_vim@v1.2.0/deps.ts";
import { ActionData } from "https://deno.land/x/ddu_kind_file@v0.2.0/file.ts";
import { globals } from "https://deno.land/x/denops_std@v3.1.4/variable/variable.ts";

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

  gather(
    { denops }: Args,
  ): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const cocJumpLocations: LocationData[] =
          await globals.get(denops, "coc_jump_locations") ?? [];
        let items: Item<ActionData>[] = [];
        items = cocJumpLocations.map((location) => ({
          word: location.text,
          action: {
            path: location.filename,
            col: location.col,
            bufNr: location.bufnr,
            text: location.text,
            lineNr: location.lnum,
          },
        }));
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
