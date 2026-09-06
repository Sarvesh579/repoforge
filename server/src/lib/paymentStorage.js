const { createClient } = require('@supabase/supabase-js');

const BUCKET = process.env.PAYMENTS_SUPABASE_BUCKET || 'PAYMENT';
const ID_BUCKET = process.env.IDS_SUPABASE_BUCKET || 'hackathon-submissions';

let _paymentsSupabase;
let _idsSupabase;
function getPaymentsSupabase() {
    if (!_paymentsSupabase) {
        if (!process.env.PAYMENTS_SUPABASE_URL || !process.env.PAYMENTS_SUPABASE_SERVICE_KEY) {
            throw new Error('Payments Supabase environment variables are not configured.');
        }
        _paymentsSupabase = createClient(
            process.env.PAYMENTS_SUPABASE_URL,
            process.env.PAYMENTS_SUPABASE_SERVICE_KEY,
            { auth: { persistSession: false } }
        );
    }
    return _paymentsSupabase;
}

function getIdsSupabase() {
    if (!_idsSupabase) {
        if (!process.env.IDS_SUPABASE_URL || !process.env.IDS_SUPABASE_SERVICE_KEY) {
            throw new Error('ID Supabase environment variables are not configured.');
        }
        _idsSupabase = createClient(
            process.env.IDS_SUPABASE_URL,
            process.env.IDS_SUPABASE_SERVICE_KEY,
            { auth: { persistSession: false } }
        );
    }
    return _idsSupabase;
}

async function uploadPaymentScreenshot(filePath, buffer, mimeType) {
    const supabase = getPaymentsSupabase();

    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (error) {
        throw new Error(`Payment storage upload failed: ${error.message}`);
    }

    return { path: data.path };
}


async function uploadParticipantId(filePath, buffer, mimeType) {
    const supabase = getIdsSupabase();

    const { data, error } = await supabase.storage
        .from(ID_BUCKET)
        .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (error) {
        throw new Error(`ID card storage upload failed: ${error.message}`);
    }

    return { path: data.path };
}

async function deletePaymentScreenshot(filePath) {
    if (!filePath) return;
    try {
        const supabase = getPaymentsSupabase();
        await supabase.storage.from(BUCKET).remove([filePath]);
    } catch (err) {
        console.warn('[PaymentStorage] Failed to delete payment screenshot:', err.message);
    }
}

async function deleteParticipantIdFile(filePath) {
    if (!filePath) return;
    try {
        const supabase = getIdsSupabase();
        await supabase.storage.from(ID_BUCKET).remove([filePath]);
    } catch (err) {
        console.warn('[PaymentStorage] Failed to delete participant ID file:', err.message);
    }
}

module.exports = { uploadPaymentScreenshot, uploadParticipantId, deletePaymentScreenshot, deleteParticipantIdFile };
