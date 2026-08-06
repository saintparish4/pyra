// Emergency Reporting export parser.
//
// Emergency Reporting exports its own CSV/XLSX layout rather than raw NFIRS,
// so this parser owns that dialect. Waits on `@pyra/neris` for the target
// shape, same as `../nfirs-flatfile`.
export {};
