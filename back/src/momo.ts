import axios from 'axios';


const MOMO_BASE = process.env.MOMO_BASE!
const MOMO_TARGET = process.env.MOMO_TARGET!;
const MOMO_COLLECTION_KEY = process.env.MOMO_COLLECTION_KEY!;
const MOMO_DISBURSEMENT_KEY = process.env.MOMO_DISBURSEMENT_KEY!;
const MOMO_API_USER = process.env.MOMO_API_USER!;
const MOMO_API_KEY = process.env.MOMO_API_KEY!;

export async function getCollectionToken() : Promise<string> {
    const url = `${MOMO_BASE}/collection/token/`;
    const res = await axios.post(url, '', {
        headers: { 'Ocp-Apim-Subscription-Key': MOMO_COLLECTION_KEY},
        auth: { username: MOMO_API_USER, password: MOMO_API_KEY}
    });
    return res.data.access_token as string;
}

export async function getDisbursementsToken() : Promise<string> {
    const url = `${MOMO_BASE}/disbursement/token/`;
    const res = await axios.post(url, '', {
        headers: { 'Ocp-Apim-Subscription-Key': MOMO_DISBURSEMENT_KEY},
        auth: { username: MOMO_API_USER, password: MOMO_API_KEY}
    });
    return res.data.access_token as string;
}

export async function requestToPay({ token, referenceId, amount, currency, msisdn, externalId } : 
    {token: string, referenceId: string, amount: string, currency: string, msisdn: string, externalId: string }) {
    const url = `${MOMO_BASE}/collection/v1_0/requesttopay`;
    await axios.post(url, {
        amount: amount,
        currency: currency,
        externalId: externalId,
        payer: { partyIdType: "MSISDN", partyId: msisdn },
        payerMessage: 'Top-up',
        payeeNote: 'PULA-PAY'
    }, {
        headers: {
            Authorization: `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': MOMO_TARGET,
            'Ocp-Apim-Subscription-Key': MOMO_COLLECTION_KEY,
            'Content-Type': "application/json"
        }
    });
}

export async function getRequestToPayStatus({ token, referenceId, }: 
    {token: string, referenceId: string }) {
    const url = `${MOMO_BASE}/collection/v1_0/requesttopay/${referenceId}`;
    const { data } = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'X-Target-Environment': MOMO_TARGET,
            'Ocp-Apim-Subscription-Key': MOMO_COLLECTION_KEY
        }
    });
    return data;
}

export async function transfer({ token, referenceId, amount, currency, msisdn, externalId }:
    {token: string, referenceId: string, amount: string, currency: string, msisdn: string, externalId: string }) {
    const url = `${MOMO_BASE}/disbursement/v1_0/transfer`;
    await axios.post(url, {
        amount: amount,
        currency: currency,
        externalId: externalId,
        payee: { partyIdType: "MSISDN", partyId: msisdn},
        payerMessage: "PULA-PAY",
        payeeNote: "Withdraw"
    }, {
        headers: {
            Authorization: `Bearer ${token}`,
            'X-Reference-Id': referenceId,
            'X-Target-Environment': MOMO_TARGET,
            'Ocp-Apim-Subscription-Key': MOMO_DISBURSEMENT_KEY,
            'Content-Type': "application/json"
        }
    });
}

export async function getTransfertStatus({ token, referenceId, }: 
    {token: string, referenceId: string }) {
    const url = `${MOMO_BASE}/disbursement/v1_0/transfer/${referenceId}`;
    const { data } = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            'X-Target-Environment': MOMO_TARGET,
            'Ocp-Apim-Subscription-Key': MOMO_DISBURSEMENT_KEY
        }
    });
    return data;
}