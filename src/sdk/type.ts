export type HexNoPrefix = string;

export interface TransferOption {
  toAddress: string;
  amountInCKB: string;
  feeRate?: number;
}
