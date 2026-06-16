// classic `node` moduleResolution (module=commonjs) can't read socks-proxy-agent's
// `exports`-only package.json, so map the bare specifier to its bundled .d.ts.
// Runtime resolution is handled by Node via the package's `exports` field.
declare module 'socks-proxy-agent' {
  export * from 'socks-proxy-agent/dist';
}
