'use server';

import { findMembershipsByEmailAndStatus, getRecurringCollection, disablePaymentToken } from './apiClient';

// Define the input type for processEmailsAction
export interface ProcessFormInput {
  email: string;
  primeStatus: string;
  brand: string;
  originalRowData?: Record<string, string>; // To hold the original CSV row data
}

export interface ProcessedItem extends ProcessFormInput {
  taskStatus: string; // e.g., "Tokens Disabled", "No Membership", "Error"
  processedMessage: string; // More detailed message for this item
}

// --- The Main Server Action ---
export async function processEmailsAction(itemsToProcess: ProcessFormInput[]): Promise<{ logs: string[]; results: ProcessedItem[] }> {
  const logs: string[] = [];
  const results: ProcessedItem[] = [];
  logs.push(`Starting processing for ${itemsToProcess.length} item(s)...`);

  for (const item of itemsToProcess) {
    
    const { email, primeStatus, brand } = item;
    let itemLog = `\n--- Processing Email: ${email}, Prime Status: ${primeStatus}, Brand: ${brand} ---\n`;
    let taskStatus = "Pending";
    let processedMessage = "";
    let successCount = 0;
    let failureCount = 0;
    let tokensProcessed = 0;

    try {
      // 1. Find Memberships (now using primeStatus)
      const memberships = await findMembershipsByEmailAndStatus(email, primeStatus, brand);
      if (memberships.length === 0) {
        itemLog += `No memberships found for ${email} with Prime Status "${primeStatus}", Brand: "${brand}"..\n`;
        taskStatus = "No Membership Found";
        processedMessage = `No memberships found email: for ${email}, Prime Status ${primeStatus}, Brand: "${brand}".`;
      }
      else {
        itemLog += `Found ${memberships.length} membership(s).\n`;
        let membershipTokensDisabled = 0;
        for (const membership of memberships) {
          const { recurringCollectionId } = membership;
          if (!recurringCollectionId) {
            itemLog += `Membership ID ${membership.id} is missing recurringCollectionId. Skipping.\n`;
            continue;
          }
          itemLog += `Processing recurringCollectionId: ${recurringCollectionId}.\n`;
          const recurringCollection = await getRecurringCollection(recurringCollectionId);
          if (!recurringCollection) {
            itemLog += `Could not find or fetch recurringCollection ${recurringCollectionId}. Skipping.\n`;
            continue;
          }
          const tokens = recurringCollection.paymentInstrumentRelationships;
          if (!tokens || tokens.length === 0) {
            itemLog += `No payment instrument tokens found in recurringCollection ${recurringCollectionId}.\n`;
            continue;
          }
          itemLog += `Found ${tokens.length} token relationship(s).\n`;
          tokensProcessed += tokens.length;

          for (const tokenRel of tokens) {
            const { paymentInstrumentToken } = tokenRel;
            if (!paymentInstrumentToken) {
              itemLog += `Skipping relationship due to missing paymentInstrumentToken.\n`;
              continue;
            }
            itemLog += `Attempting to disable token: ${paymentInstrumentToken.token}... `;
            const success = await disablePaymentToken(recurringCollectionId, paymentInstrumentToken.token!);
            if (success) {
              itemLog += "Successfully disabled.\n";
              successCount++;
              membershipTokensDisabled++;
            } else {
              itemLog += "Failed to disable.\n";
              failureCount++;
            }
          }
        }
        if (tokensProcessed === 0 && memberships.length > 0) {
            taskStatus = "ALREADY DISABLED";
            processedMessage = "Memberships found, but no payment Instrument token to disable. Possibly already Disabled";
        } else if (failureCount > 0 && successCount > 0) {
            taskStatus = "Partial Success";
            processedMessage = `${successCount} token(s) disabled, ${failureCount} failed.`;
        } else if (successCount > 0 && failureCount === 0) {
            taskStatus = "DISABLED";
            processedMessage = `${successCount} Payment instrument token(s) disabled.`;
        } else if (failureCount > 0 && successCount === 0) {
            taskStatus = "Error Disabling Payment Instrument Tokens";
            processedMessage = `All ${failureCount} payment instrument token(s) failed to disable.`;
        } else { // Should not happen if tokensProcessed > 0
            taskStatus = "Review Logs";
            processedMessage = "Processing complete, review logs for details.";
        }
      }
    } catch (error: any) {
      console.error(`Error processing ${email} (Status: ${primeStatus}, Brand: ${brand}):`, error);
      itemLog += `EXCEPTION: ${error.message || 'Unknown error'}\n`;
      taskStatus = "Processing Error";
      processedMessage = error.message || "An unknown error occurred during processing.";
    }
    logs.push(itemLog.trim()); // Add item-specific log to main logs
    results.push({ ...item, taskStatus, processedMessage });
  }

  logs.push('\n--- Processing Complete ---');
  return { logs, results };
}