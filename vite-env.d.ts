/// <reference types="vite/client" />

// declare namespace React {
//   interface JSX {
//     IntrinsicElements: {
//       [elemName: string]: any;
//     };
//   }
// }

// declare module 'react' {
//   export = React;
//   export as namespace React;
// }

interface ImportMetaEnv {
  readonly VITE_ENDPOINT_URL: string;
  readonly VITE_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}