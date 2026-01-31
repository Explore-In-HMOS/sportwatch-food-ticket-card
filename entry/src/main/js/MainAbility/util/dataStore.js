import file from '@system.file';
import { readValue, writeValue, deleteValue } from './keyStore';

const SUKS_FILE = 'internal://app/suks.json';
const CURSOR_KEY = 'suksCursor';

function getCursor(cb) {

    readValue(
        CURSOR_KEY,
        (v) => {
            let n = parseInt(v, 10);
            if (!Number.isFinite(n) || n < 0) {
                n = 0;
            }
            cb(n);
        },
        () => cb(0)
    );
}

function setCursor(n, cb) {
    writeValue(CURSOR_KEY, String(n), () => cb?.());
}

function readArray(cb) {
    file.readText({
        uri: SUKS_FILE,
        success: (data) => {
            let arr = [];
            try {
                arr = JSON.parse(data.text || '[]');
            } catch (e) {
            }
            cb(Array.isArray(arr) ? arr : []);
        },
        fail: () => cb([])
    });
}

export function saveSuksArray(arr, cb) {
    console.info(`[dataStore] saveSuksArray called with ${arr ? arr.length : 0} items`);
    const jsonText = JSON.stringify(arr || []);
    console.info(`[dataStore] JSON to save: ${jsonText.substring(0, 100)}`);

    file.writeText({
        uri: SUKS_FILE,
        text: jsonText,
        success: () => {
            console.info('[dataStore] File written successfully');
            setCursor(0, () => {
                console.info('[dataStore] Cursor reset to 0');
                cb?.(true);
            });
        },
        fail: (data, code) => {
            console.error(`[dataStore] saveSuksArray fail, code:${code}, data:${data}`);
            cb?.(false);
        }
    });
}

export function numberOfSuks(cb) {
    getCursor((cursor) => {
        console.info(`[dataStore] numberOfSuks cursor: ${cursor}`);
        readArray((arr) => {
            const count = Math.max(0, arr.length - cursor);
            console.info(`[dataStore] numberOfSuks arr.length: ${arr.length}, result: ${count}`);
            cb(count);
        });
    });
}

export function peekNextSuk(cb) {
    getCursor((cursor) => {
        readArray((arr) => {
            if (cursor >= arr.length) {
                return cb({ done: true, suk: null, remaining: 0 });
            }
            return cb({ done: false, suk: arr[cursor], remaining: arr.length - cursor });
        });
    });
}

export function consumeNextSuk(cb) {
    getCursor((cursor) => {
        console.info(`[consumeNextSuk] cursor: ${cursor}`);
        readArray((arr) => {
            console.info(`[SUK] cursor: ${cursor}, len: ${arr.length}`);

            if (cursor >= arr.length) {
                cb({ done: true, suk: null, remaining: 0 });
                return;
            }

            const suk = arr[cursor];
            const newCursor = cursor + 1;

            setCursor(newCursor, () => {
                cb({ done: false, suk, remaining: Math.max(0, arr.length - newCursor) });
                return;
            });
        });
    });
}

export function clearSuks(cb) {
    deleteValue(CURSOR_KEY, () => {
    });
    file.delete({
        uri: SUKS_FILE,
        success: () => cb?.(true),
        fail: () => cb?.(false)
    });
}
