// src/utils/pinBlock.ts
import CryptoJS from 'crypto-js';

// Builds the encrypted PIN the server expects, the same way the website does:
//   1. PIN block   = "0" + PIN length + PIN, padded with F to 16 characters.
//   2. Account block = "0000" + 12 digits of the mobile number, taken from
//      just before its last digit.
//   3. The two blocks are XOR-ed, then encrypted with Triple DES (ECB).
//   4. The result is sent as upper-case hex.
export function encryptPinBlock(
    mobileNumber: string,
    pin: string,
    keyHex: string
): string {
    if (!/^[0-9A-Fa-f]{32}$/.test(keyHex)) {
        throw new Error('PIN encryption key is missing or invalid.');
    }

    if (!/^\d{4}$/.test(pin)) {
        throw new Error('PIN must be 4 digits.');
    }

    const digits = mobileNumber.replace(/\D/g, '');

    if (digits.length < 4) {
        throw new Error('Registered mobile number is missing.');
    }

    // PIN part, e.g. PIN 1234 -> 041234FFFFFFFFFF
    const pinPart = `0${pin.length}${pin}FFFFFFFFFFFFFF`.substring(0, 16);

    // Account part: the 12 digits before the last digit of the number.
    const padded = `0000000000000000${digits}`;
    const accountPart = `0000${padded.substring(padded.length - 13, padded.length - 1)}`;

    // XOR the two blocks, two hex characters (one byte) at a time.
    let blockHex = '';
    for (let i = 0; i < 16; i += 2) {
        const byte =
            parseInt(pinPart.substring(i, i + 2), 16) ^
            parseInt(accountPart.substring(i, i + 2), 16);
        blockHex += byte.toString(16).padStart(2, '0');
    }

    // The 32-character key is used as two keys, repeated: K1 K2 K1.
    const fullKey = CryptoJS.enc.Hex.parse(keyHex + keyHex.substring(0, 16));

    const encrypted = CryptoJS.TripleDES.encrypt(
        CryptoJS.enc.Hex.parse(blockHex),
        fullKey,
        { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
    );

    return encrypted.ciphertext.toString(CryptoJS.enc.Hex).toUpperCase();
}
