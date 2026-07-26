"use client";

// CMS migration M1c — editor-side twin of the `dataTable` rich-text node.
//
// An ATOM node: the table's data lives entirely in attrs ({caption, headers,
// rows}), not in editable ProseMirror content. That keeps the stored JSON
// identical to what DataTable (the public component) consumes, and makes the
// editing UI plain controlled inputs — far simpler and far harder to corrupt
// than Tiptap's full table extension, which this site's tables don't need.
import {
  Node,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from "@tiptap/react";

function TableView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const caption = (node.attrs.caption as string | null) ?? "";
  const headers = (node.attrs.headers as string[]) ?? [];
  const rows = (node.attrs.rows as string[][]) ?? [];

  const setHeader = (i: number, v: string) =>
    updateAttributes({ headers: headers.map((h, idx) => (idx === i ? v : h)) });
  const setCell = (r: number, c: number, v: string) =>
    updateAttributes({
      rows: rows.map((row, ri) =>
        ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row,
      ),
    });
  const addRow = () =>
    updateAttributes({ rows: [...rows, headers.map(() => "")] });
  const removeRow = (r: number) =>
    updateAttributes({ rows: rows.filter((_, i) => i !== r) });
  const addColumn = () =>
    updateAttributes({
      headers: [...headers, ""],
      rows: rows.map((row) => [...row, ""]),
    });
  const removeColumn = (c: number) => {
    if (headers.length <= 1) return;
    updateAttributes({
      headers: headers.filter((_, i) => i !== c),
      rows: rows.map((row) => row.filter((_, i) => i !== c)),
    });
  };

  const cellCls =
    "w-full min-w-[90px] rounded border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-2 py-1 text-[13px]";
  const btnCls =
    "rounded border border-[var(--brand-line)] px-2 py-0.5 text-[12px] text-[var(--brand-muted)] hover:bg-[var(--brand-line)]";

  return (
    <NodeViewWrapper
      contentEditable={false}
      className="my-4 rounded-[var(--radius-md)] border border-[var(--brand-line)] p-3"
    >
      <input
        value={caption}
        onChange={(e) => updateAttributes({ caption: e.target.value || null })}
        placeholder="Table caption (optional)"
        aria-label="Table caption"
        className="mb-2 w-full rounded border border-[var(--brand-line)] bg-[var(--brand-elevated)] px-2 py-1 text-[13px]"
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="p-1 align-top">
                  <input
                    value={h}
                    onChange={(e) => setHeader(i, e.target.value)}
                    placeholder={`Column ${i + 1}`}
                    aria-label={`Column ${i + 1} heading`}
                    className={`${cellCls} font-semibold`}
                  />
                  <button
                    type="button"
                    onClick={() => removeColumn(i)}
                    className={`${btnCls} mt-1`}
                  >
                    − col
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="p-1">
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      aria-label={`Row ${r + 1}, ${headers[c] || `column ${c + 1}`}`}
                      className={cellCls}
                    />
                  </td>
                ))}
                <td className="p-1">
                  <button
                    type="button"
                    onClick={() => removeRow(r)}
                    className={btnCls}
                  >
                    − row
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex gap-2">
        <button type="button" onClick={addRow} className={btnCls}>
          + row
        </button>
        <button type="button" onClick={addColumn} className={btnCls}>
          + column
        </button>
        <button
          type="button"
          onClick={deleteNode}
          className={`${btnCls} ml-auto text-[var(--brand-danger)]`}
        >
          Delete table
        </button>
      </div>
    </NodeViewWrapper>
  );
}

export const DataTableNode = Node.create({
  name: "dataTable",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      caption: { default: null },
      headers: { default: ["Column 1", "Column 2"] },
      rows: { default: [["", ""]] },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-datatable]" }];
  },

  renderHTML() {
    return ["div", { "data-datatable": "" }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableView);
  },
});
