declare module 'react-signature-canvas' {
  import * as React from 'react';
  
  interface SignatureCanvasProps {
    canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
    clearOnResize?: boolean;
    dotSize?: number | (() => number);
    maxWidth?: number;
    minDistance?: number;
    minWidth?: number;
    penColor?: string;
    velocityFilterWeight?: number;
    backgroundColor?: string;
    onBegin?: () => void;
    onEnd?: () => void;
  }
  
  class SignatureCanvas extends React.Component<SignatureCanvasProps> {
    clear(): void;
    isEmpty(): boolean;
    fromDataURL(dataURL: string, options?: { ratio?: number; width?: number; height?: number }): void;
    toDataURL(type?: string, encoderOptions?: number): string;
    toData(): Array<Array<{ x: number; y: number; time: number }>>;
    fromData(data: Array<Array<{ x: number; y: number; time: number }>>): void;
    off(): void;
    on(): void;
    getCanvas(): HTMLCanvasElement;
    getTrimmedCanvas(): HTMLCanvasElement;
    getSignaturePad(): any;
  }
  
  export default SignatureCanvas;
}
