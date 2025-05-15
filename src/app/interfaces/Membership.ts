// --- Interfaces (Define based on your actual API responses) ---
export interface Membership {
  id: string;
  website?: string;
  status?: string,
  autoRenewal?: string;
  memberAccountId?: number;
  expirationDate?: string;
  activationDate?: string;
  timestamp?: string;
  userCreditCardId?: string;
  membershipType?: string;
  balance?: number;
  monthsDuration?: number;
  durationTimeUnit?: string;
  duration?: number;
  productStatus?: string;
  totalPrice?: number;
  renewalPrice?: number;
  renewalDuration?: number;
  freeTrial?: boolean;
  remindRenewal?: true;
  currencyCode?: string;
  sourceType?: string;
  funnel?: string;
  recurringId?: string;
  membershipRecurring?: string;
  recurringCollectionId?: string;
  feeContainerId?: null;
  memberStatusActions?: string[];
  memberAccount?: MembershipAccount;
  collection?: string;
  membershipCollection?: string;
  membershipCancellationRequest?: string;
  jobs?: Job[];
  perks?: Perk[];
  feeModel?: string;
  postSubscriptionFreeTrialAbuseEvaluationId?: PostSubscriptionFreeTrialAbuseEvaluationId[];
  freeTrialAbuseDetected?: boolean;
  membershipTierId?: string;
  membershipOfferId?: string;
  // other membership fields...
}
  
export interface MembershipAccount {
  id: string;
  userId?: string;
  name?: string;
  lastNames?: string;
  memberships?: string[];
  committedUntil?: string;
}
  
export interface Job {
  id?: string;
  jobId?: string;
  jobType?: string;
  jobStatus?: string;
  timestamp?: string;
  modifyDate?: string;
}
  
export interface Perk {
    uuid?: string;
    perkType?: string;
    startTime?: string;
    endTime?: string;
}
  
export interface PostSubscriptionFreeTrialAbuseEvaluationId {
  id?: string;
}

  