/**
 * A vendor export reader.
 *
 * `TRecord` is deliberately unbound: the record type is whatever the vendor's
 * own format yields, and the NERIS shape it eventually maps to doesn't exist
 * yet (see `@pyra/neris`). Mapping vendor -> NERIS is a separate step, not the
 * parser's job — a parser only has to turn bytes into rows it can vouch for.
 */
export interface Parser<TRecord> {
	/** Stable key used to select the parser, e.g. `"nfirs-flatfile"`. */
	readonly id: string;

	/**
	 * Streams records out of `source`. Async so a multi-hundred-MB export is
	 * never held in memory whole; `AsyncIterable<Uint8Array>` so a Node
	 * `Readable`, a fetch body, or an in-memory buffer all satisfy it.
	 */
	parse(source: AsyncIterable<Uint8Array>): AsyncIterable<TRecord>;
}
