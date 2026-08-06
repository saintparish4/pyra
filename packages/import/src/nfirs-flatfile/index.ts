// NFIRS 5.0 flat-file parser.
//
// Reads the pipe-delimited NFIRS export set (BASICINCIDENT, FIREINCIDENT,
// CIVILIANCASUALTY, ...) into records keyed by incident. Implementing this
// needs the `NFIRS Crosswalk` column from NERIS `type_incident.yml` to map
// incident types, so it waits on `@pyra/neris`.
export {};
