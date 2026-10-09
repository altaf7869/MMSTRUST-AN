export interface Donor { name: string; type: string; village?: string; amount: number; date: string; year: string; receiptNo?: string; anonymous?: boolean; }
export interface Expense { description: string; category: string; amount: number; date: string; year: string; voucherNo?: string; }
export type Trust = Record<string, any>;
