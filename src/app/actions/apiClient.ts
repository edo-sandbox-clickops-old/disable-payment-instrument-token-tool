import { Membership } from "../interfaces/Membership";
import { RecurringCollection } from "../interfaces/RecurringCollection";
import { mapRecurringCollection } from "../mappers/RecurringCollectionMapper";

export async function findMembershipsByEmailAndStatus(email: string, primeStatus: string, brand: string): Promise<Membership[]> {
  console.log(`[API Call] Searching memberships for: ${email}, Prime Status: ${primeStatus}, Brand: ${brand}`);
  try {
    const params = new URLSearchParams({ search: `{"email":"${email}","brand":"${brand}","withJobs" :"true","status":"${primeStatus}","sort":{"sortBy":"TIMESTAMP", "sortCriteria":"ASC", "pagination":{"limit":1, "offset":0}}}` });
    const response = await fetch(`https://lb.membership.gke-apps.edo.sv/membership/search/v1/memberships?${params}`, {
      method: "GET",
      headers: { 
        "Accept": "*/*",
        "Accept-encoding": "gzip, deflate, br",
        "content-type": "application/json",
      },
    });
    if (!response.ok) console.error(`Failed to fetch memberships for ${email} and status ${primeStatus}`);
    return await response.json();
  } catch (error: any) {
    throw new Error(error);
  }
}

export async function getRecurringCollection(recurringCollectionId: string): Promise<RecurringCollection | null> {
  console.log(`[API Call] Getting recurring collection: ${recurringCollectionId}`);
  try {
    const response = await fetch(`https://lb.recurring-collection.gke-apps.edo.sv/recurring-collection/recurring-collections/${recurringCollectionId}`, {
      headers: {       
        "Accept": "*/*",
        "content-type": "application/json",
      }
    });
    if (!response.ok) {
      console.error(`Failed to fetch recurring collection ${recurringCollectionId}, Status: ${response.status}`)
      return null;
    }
    return mapRecurringCollection(await response.json());
  } catch (error: any) {
    throw new Error(error)
  }
}

export async function disablePaymentToken(recurringCollectionId: string, paymentInstrumentToken: string): Promise<boolean> {
  console.log(`[API Call] Disabling token ${paymentInstrumentToken} for collection ${recurringCollectionId}`);
  try {
    const response = await fetch(`https://lb.recurring-collection.gke-apps.edo.sv/recurring-collection/recurring-collections/${recurringCollectionId}/paymentInstrumentTokens/${paymentInstrumentToken}/remove`, {
      method: 'PUT',
      headers: { 
        "Accept": "*/*",
        "content-type": "application/json",
      }
    });
    if (!response.ok) {
      console.error(`Failed to disable payment instrument ${paymentInstrumentToken} of recurringCollection: ${recurringCollectionId}`)
      return false; 
    }
    return response.ok;
  } catch (error: any) {
    throw new Error(error)
  }
}
