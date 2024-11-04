declare module 'react-toastify' {
    export const toast: {
      success(message: string, options?: object): void;
      error(message: string, options?: object): void;
      info(message: string, options?: object): void;
      warning(message: string, options?: object): void;
    };
    
    export function ToastContainer(props: any): JSX.Element;
  }