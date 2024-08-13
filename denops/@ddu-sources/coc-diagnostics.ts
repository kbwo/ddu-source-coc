import { Denops } from "jsr:@denops/core@^7.0.0/type";
import {
  SourceOptions,
  BaseSource,
  Item,
  ItemHighlight,
} from "jsr:@shougo/ddu-vim/types";
import { ActionData } from "./types.ts";
import { relative } from "jsr:@std/path@^1.0.2/relative";
import { fn } from "https://jsr.io/@shougo/ddu-vim/5.0.0/denops/ddu/deps.ts";

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

type Diagnostic = {
  file: string;
  lnum: number;
  end_lnum: number;
  location: {
    uri: string;
    range: {
      end: RangeData;
      start: RangeData;
    };
  };
  source: string;
  code: string;
  level: number;
  message: string;
  end_col: number;
  col: number;
  severity: Severity;
};
type Severity = "Error" | "Warning" | "Information" | "Hint";

const highlight = (severity: Severity) => {
  switch (severity) {
    case "Error":
      return "CocErrorSign";
    case "Warning":
      return "CocWarningSign";
    case "Information":
      return "CocInfoSign";
    case "Hint":
      return "CocHintSign";
  }
};

const trimNullCharacters = (input: string): string => {
  return input.replace(/\n/g, " ");
};

export class Source extends BaseSource<Params> {
  kind = "file";

  gather({ denops }: Args): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const diagnostics: Diagnostic[] =
          ((await denops.call(
            "CocAction",
            "diagnosticList"
          )) as Diagnostic[]) ?? [];
        const cwd = (await fn.getcwd(denops)) as string;

        const items: Item<ActionData>[] = diagnostics.map((d) => {
          const message = trimNullCharacters(d.message);
          const pathText = relative(cwd, d.file);
          const position = `${pathText}:${d.lnum}`;
          const source = `[${[d.source, d.code].filter(Boolean).join(" ")}]`;
          const display = `${position} ${source} ${d.severity} ${message}`;
          return {
            word: display,
            display,
            action: {
              path: d.file,
              col: d.col,
              lineNr: d.lnum,
            },
            highlights: [
              {
                name: "RelativePath",
                hl_group: "CocListPath",
                col: 1,
                width: position.length + 1,
              },
              {
                name: "Diagnostic" + d.severity,
                hl_group: highlight(d.severity),
                col: `${position} ${source} `.length + 1,
                width: d.severity.length + 1,
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
