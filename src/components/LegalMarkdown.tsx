import { Fragment, type ReactNode } from "react";

/**
 * Minimal markdown renderer for the legal documents (headings, numbered
 * lists with nested "1)" items, tables, **bold**, autolinked URLs/e-mails).
 * In-house on purpose: no runtime dependency, server-rendered, no HTML
 * injection (input is our own static text, output is React nodes).
 */

const INLINE = /(\*\*[^*]+\*\*|https?:\/\/[^\s)|,;]+[^\s)|,;.]|[\w.+-]+@[\w-]+\.[\w.]+[\w])/g;

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) {
      out.push(<strong key={key}>{inline(tok.slice(2, -2), key)}</strong>);
    } else if (tok.startsWith("http")) {
      out.push(
        <a key={key} href={tok} className="break-words underline underline-offset-2" rel="noopener noreferrer" target={tok.includes("kilometrowka") ? undefined : "_blank"}>
          {tok}
        </a>,
      );
    } else {
      out.push(
        <a key={key} href={`mailto:${tok}`} className="underline underline-offset-2">
          {tok}
        </a>,
      );
    }
    last = idx + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { t: "h"; level: number; text: string }
  | { t: "p"; text: string }
  | { t: "ol"; items: { text: string; sub: string[] }[] }
  | { t: "table"; head: string[]; rows: string[][] };

function cells(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

export function parseLegalMarkdown(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      blocks.push({ t: "h", level: h[1].length, text: h[2] });
      i++;
      continue;
    }
    if (line.trim().startsWith("|")) {
      const tbl: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) tbl.push(lines[i++]);
      const rows = tbl.filter((l) => !/^\|\s*-/.test(l.trim())).map(cells);
      blocks.push({ t: "table", head: rows[0] ?? [], rows: rows.slice(1) });
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      const items: { text: string; sub: string[] }[] = [];
      while (i < lines.length && (/^\d+\.\s/.test(lines[i]) || /^\s+\S/.test(lines[i]))) {
        const l = lines[i++];
        const top = /^\d+\.\s+(.*)$/.exec(l);
        if (top) items.push({ text: top[1], sub: [] });
        else if (items.length) {
          const sub = /^\s+(?:\d+\)|[a-z]\)|[-*])\s+(.*)$/.exec(l);
          if (sub) items[items.length - 1].sub.push(sub[1]);
          else items[items.length - 1].text += " " + l.trim();
        }
      }
      blocks.push({ t: "ol", items });
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|\||\d+\.\s)/.test(lines[i].trim())) para.push(lines[i++].trim());
    if (para.length) blocks.push({ t: "p", text: para.join(" ") });
    else i++;
  }
  return blocks;
}

export default function LegalMarkdown({ source }: { source: string }) {
  const blocks = parseLegalMarkdown(source);
  return (
    <div className="space-y-4 text-sm leading-relaxed text-slate-700">
      {blocks.map((b, bi) => {
        const k = `b${bi}`;
        if (b.t === "h") {
          if (b.level <= 2)
            return (
              <h2 key={k} className="pt-4 text-lg font-semibold text-slate-900">
                {inline(b.text, k)}
              </h2>
            );
          return (
            <h3 key={k} className="pt-2 font-semibold text-slate-900">
              {inline(b.text, k)}
            </h3>
          );
        }
        if (b.t === "p") return <p key={k}>{inline(b.text, k)}</p>;
        if (b.t === "ol")
          return (
            <ol key={k} className="list-decimal space-y-2 pl-6">
              {b.items.map((it, ii) => (
                <li key={`${k}-${ii}`}>
                  {inline(it.text, `${k}-${ii}`)}
                  {it.sub.length > 0 && (
                    <ol className="mt-1 space-y-1 pl-4">
                      {it.sub.map((s, si) => (
                        <li key={si}>
                          <Fragment>
                            {si + 1}) {inline(s, `${k}-${ii}-${si}`)}
                          </Fragment>
                        </li>
                      ))}
                    </ol>
                  )}
                </li>
              ))}
            </ol>
          );
        return (
          <div key={k} className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr>
                  {b.head.map((c, ci) => (
                    <th key={ci} className="border border-slate-200 bg-slate-50 p-2 font-semibold text-slate-900">
                      {inline(c, `${k}-h${ci}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, ri) => (
                  <tr key={ri}>
                    {r.map((c, ci) => (
                      <td key={ci} className="border border-slate-200 p-2 align-top">
                        {inline(c, `${k}-${ri}-${ci}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
