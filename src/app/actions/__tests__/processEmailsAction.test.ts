// src/app/actions/__tests__/processEmailsAction.test.ts
import { processEmailsAction, ProcessFormInput } from '../processEmails';

jest.mock('../apiClient', () => ({
  findMembershipsByEmailAndStatus: jest.fn(),
  getRecurringCollection: jest.fn(),
  disablePaymentToken: jest.fn(),
}));

// Now import the mocked functions to control their behavior in tests
const {
  findMembershipsByEmailAndStatus,
  getRecurringCollection,
  disablePaymentToken,
} = require('../apiClient'); // Use require for mocked module

describe('processEmailsAction', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should process an item successfully and disable tokens', async () => {
    const itemsToProcess: ProcessFormInput[] = [
      { email: 'test@example.com', primeStatus: 'ACTIVATED', brand: 'ED', originalRowData: {} },
    ];

    (findMembershipsByEmailAndStatus as jest.Mock).mockResolvedValue([
      { id: 'mem1', recurringCollectionId: 'rc1' },
    ]);
    (getRecurringCollection as jest.Mock).mockResolvedValue({
      id: 'rc1',
      paymentInstrumentRelationships: [{ paymentInstrumentToken: { token: 'tok1' } }],
    });
    (disablePaymentToken as jest.Mock).mockResolvedValue(true);

    const { logs, results } = await processEmailsAction(itemsToProcess);

    expect(findMembershipsByEmailAndStatus).toHaveBeenCalledWith('test@example.com', 'ACTIVATED', 'ED');
    expect(getRecurringCollection).toHaveBeenCalledWith('rc1');
    expect(disablePaymentToken).toHaveBeenCalledWith('rc1', 'tok1');
    expect(results.length).toBe(1);
    expect(results[0].taskStatus).toBe('DISABLED');
    expect(results[0].processedMessage).toBe('1 Payment instrument token(s) disabled.');
    expect(logs.some(log => log.includes("Successfully disabled."))).toBe(true);
  });

  it('should handle "No Membership Found"', async () => {
    const itemsToProcess: ProcessFormInput[] = [
      { email: 'nomember@example.com', primeStatus: 'EXPIRED', brand: 'GV', originalRowData: {} },
    ];

    (findMembershipsByEmailAndStatus as jest.Mock).mockResolvedValue([]);

    const { logs, results } = await processEmailsAction(itemsToProcess);

    expect(findMembershipsByEmailAndStatus).toHaveBeenCalledWith('nomember@example.com', 'EXPIRED', 'GV');
    expect(getRecurringCollection).not.toHaveBeenCalled();
    expect(disablePaymentToken).not.toHaveBeenCalled();
    expect(results.length).toBe(1);
    expect(results[0].taskStatus).toBe('No Membership Found');
    expect(results[0].processedMessage).toBe('No memberships found email: for nomember@example.com, Prime Status EXPIRED, Brand: "GV".');
    expect(logs.some(log => log.includes("No memberships found"))).toBe(true);
  });

  it('should handle "No Actionable Tokens Found"', async () => {
    const itemsToProcess: ProcessFormInput[] = [
      { email: 'notokens@example.com', primeStatus: 'ACTIVATED', brand: 'OP', originalRowData: {} },
    ];

    (findMembershipsByEmailAndStatus as jest.Mock).mockResolvedValue([
      { id: 'mem2', recurringCollectionId: 'rc2' },
    ]);
    (getRecurringCollection as jest.Mock).mockResolvedValue({
      id: 'rc2',
      paymentInstrumentRelationships: [], // No tokens
    });

    const { logs, results } = await processEmailsAction(itemsToProcess);

    expect(findMembershipsByEmailAndStatus).toHaveBeenCalledWith('notokens@example.com', 'ACTIVATED', 'OP');
    expect(getRecurringCollection).toHaveBeenCalledWith('rc2');
    expect(disablePaymentToken).not.toHaveBeenCalled();
    expect(results.length).toBe(1);
    expect(results[0].taskStatus).toBe('ALREADY DISABLED');
    expect(results[0].processedMessage).toBe('Memberships found, but no payment Instrument token to disable. Possibly already Disabled');
    expect(logs.some(log => log.includes("No payment instrument tokens found"))).toBe(true);
  });

  it('should handle API error during findMembershipsByEmailAndStatus', async () => {
    const itemsToProcess: ProcessFormInput[] = [
      { email: 'apierror@example.com', primeStatus: 'ACTIVATED', brand: 'TL', originalRowData: {} },
    ];
    const errorMessage = "Network Error";
    (findMembershipsByEmailAndStatus as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { logs, results } = await processEmailsAction(itemsToProcess);

    expect(results.length).toBe(1);
    expect(results[0].taskStatus).toBe('Processing Error');
    expect(results[0].processedMessage).toBe(errorMessage);
    expect(logs.some(log => log.includes(`EXCEPTION: ${errorMessage}`))).toBe(true);
  });

  it('should handle partial success if some tokens fail to disable', async () => {
    const itemsToProcess: ProcessFormInput[] = [
        { email: 'partial@example.com', primeStatus: 'ACTIVATED', brand: 'ED', originalRowData: {} },
    ];

    (findMembershipsByEmailAndStatus as jest.Mock).mockResolvedValue([
        { id: 'mem_partial', recurringCollectionId: 'rc_partial' },
    ]);
    (getRecurringCollection as jest.Mock).mockResolvedValue({
        id: 'rc_partial',
        paymentInstrumentRelationships: [
            { paymentInstrumentToken: { token: 'tok_ok' } },
            { paymentInstrumentToken: { token: 'tok_fail' } },
        ],
    });
    (disablePaymentToken as jest.Mock)
        .mockResolvedValueOnce(true)   // tok_ok succeeds
        .mockResolvedValueOnce(false); // tok_fail fails

    const { logs, results } = await processEmailsAction(itemsToProcess);

    expect(disablePaymentToken).toHaveBeenCalledTimes(2);
    expect(results[0].taskStatus).toBe('Partial Success');
    expect(results[0].processedMessage).toBe('1 token(s) disabled, 1 failed.');
    expect(logs.some(log => log.includes("Successfully disabled."))).toBe(true);
    expect(logs.some(log => log.includes("Failed to disable."))).toBe(true);
  });

});