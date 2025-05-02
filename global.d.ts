// Type overrides for external libraries
import { ServerOptions } from 'vite';

// Fix for type error in server/vite.ts
declare module 'vite' {
  interface ServerOptions {
    allowedHosts?: boolean | true | string[];
  }
}
