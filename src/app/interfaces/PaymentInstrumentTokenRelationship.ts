export interface PaymentInstrumentTokenRelationship {
    paymentInstrumentToken: PaymentInstrumentToken;
    source: string |  null;
    creationDateInMillis: string | null;
    creationDate: string | null;
    preferredByCustomer: boolean | null;
}

export interface PaymentInstrumentToken {
    token: string | null;
}
  