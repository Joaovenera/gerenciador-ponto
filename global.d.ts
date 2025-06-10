// Type overrides for external libraries

// Fix for TypeScript errors in Vite configuration
// This is needed because we can't modify server/vite.ts directly
declare module 'vite' {
  interface ServerOptions {
    // Add boolean to allowedHosts possible types
    allowedHosts?: boolean | true | string[];
  }
}
