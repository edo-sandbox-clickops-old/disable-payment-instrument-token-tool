import { PaymentInstrumentToken, PaymentInstrumentTokenRelationship } from "../interfaces/PaymentInstrumentTokenRelationship";
import { Id, RecurringCollection, UserId, Website } from "../interfaces/RecurringCollection";
import { Order, RecurringProductIds, Transaction } from "../interfaces/Transactions";

export const mapRecurringCollection = (data: RecurringCollection) : RecurringCollection => {
    return {
        id: mapId(data.id),
        userId: mapUserId(data.userId),
        website: mapWebsite(data.website),
        paymentInstrumentRelationships: mapPaymentInstrumentRelationships(data.paymentInstrumentRelationships),
        transactions: mapTransactions(data.transactions),
        enabled: data.enabled
    }
}

export const mapId = (data: Id) => {
    return {
        id: data.id
    }
}

export const mapUserId = (data: UserId) => {
    return {
        id: data.id
    }
}

export const mapWebsite = (data: Website) => {
    return {
        code: data.code
    }
}

export const mapPaymentInstrumentRelationships = (data: PaymentInstrumentTokenRelationship[]) => {
    return data.map((pitRelationship) => mapPaymentInstrumentRelationship(pitRelationship))
}

export const mapPaymentInstrumentRelationship = (data: PaymentInstrumentTokenRelationship) => {
    return {
        paymentInstrumentToken: mapPaymentInstrumentToken(data.paymentInstrumentToken),
        source: data.source,
        creationDateInMillis: data.creationDateInMillis,
        creationDate: data.creationDate,
        preferredByCustomer: data.preferredByCustomer
    }
}

export const mapPaymentInstrumentToken = (data: PaymentInstrumentToken) => {
    return {
        token: data.token
    }
}

export const mapTransactions = (data: Transaction[]) => {
    return data.map((transaction) => mapTransaction(transaction));
}

export const mapTransaction = (data: Transaction) => {
    return {
        id: data.id,
        recurringOrderType: data.recurringOrderType,
        sentRecurringOrderId: data.sentRecurringOrderId,
        creationDate: data.creationDate,
        source: data.source,
        orders: mapOrders(data.orders),
        recurringProductIds: mapRecurringProductIds(data.recurringProductIds) 
    }
}

export const mapOrders = (data: Order[]) => {
    return data.map((order) => mapOrder(order));
}

export const mapOrder = (data: Order) => {
    return {
        id: data.id,
        recurringOrderId: data.recurringOrderId,
        transactionId: data.transactionId,
        creationDate: data.creationDate,
        type: data.type,
        successful: data.successful,
        errorType: data.errorType
    }
}

export const mapRecurringProductIds = (data: RecurringProductIds[]) => {
    return data.map((recurringProductId) => mapRecurringProductId(recurringProductId));
}

export const mapRecurringProductId = (data: RecurringProductIds) => {
    return {
        id: data.id,
        type: data.type
    }
}