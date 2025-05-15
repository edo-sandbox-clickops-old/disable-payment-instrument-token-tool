import { Transaction } from "./Transactions";
import { PaymentInstrumentTokenRelationship } from "./PaymentInstrumentTokenRelationship";

export interface RecurringCollection {
    id:  Id;
    userId: UserId
    website: Website
    paymentInstrumentRelationships: PaymentInstrumentTokenRelationship[];
    transactions: Transaction[],
    enabled: true
  }


export interface Id {
    id: string | null;
}

export interface UserId {
    id: string | null;
}

export interface Website {
    code: string | null;
}