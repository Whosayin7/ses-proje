export type KeyArray = number[]; // Array of 64 integers (0-255)

export interface ProcessingState {
  isRecording: boolean;
  isProcessing: boolean;
  audioDuration: number;
}

export enum CryptoMode {
  ENCRYPT = 'ENCRYPT',
  DECRYPT = 'DECRYPT'
}
