export interface Transaction {
    id: string | null;
    recurringOrderType: string | null;
    sentRecurringOrderId: string | null;
    creationDate: string | null;
    source: string | null;
    orders: Order[];
    recurringProductIds: RecurringProductIds[];    
}

export interface Order {
    id: Id;
    recurringOrderId: RecurringOrderId;
    transactionId: TransactionId;
    creationDate: string | null,
    type: string | null,
    successful: boolean | null;
    errorType: string | null;
}

export interface Id {
    id: string | null;
}

export interface RecurringOrderId {
    id: string | null;
}

export interface TransactionId {
    id: string | null;
}

export  interface RecurringProductIds {
    id: string;
    type: string;
}