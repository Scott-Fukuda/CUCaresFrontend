/// <reference types="vite/client" />

declare namespace React {
  interface JSX {
    IntrinsicElements: {
      [elemName: string]: any;
    };
  }
}

declare module 'react' {
  export = React;
  export as namespace React;
} 