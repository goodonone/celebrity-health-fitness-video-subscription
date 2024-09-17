declare module 'face-api.js' {
    export const nets: {
      ssdMobilenetv1: any;
      faceLandmark68Net: any;
      faceRecognitionNet: any;
    };
  
    export function detectSingleFace(input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement): Promise<any>;
    export function loadSsdMobilenetv1Model(url: string): Promise<void>;
    export function loadFaceLandmarkModel(url: string): Promise<void>;
    export function loadFaceRecognitionModel(url: string): Promise<void>;
  }