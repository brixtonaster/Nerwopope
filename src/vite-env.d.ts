/// <reference types="vite/client" />

declare module '@wagmi-walletconnect-raw' {
  export function walletConnect(parameters: Record<string, unknown>): any;
}

declare module '@wagmi-safe-raw' {
  export function safe(parameters?: Record<string, unknown>): any;
}
