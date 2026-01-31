import storage from '@system.storage';

export function readValue(key, onSuccess, onFail) {
    storage.get({
        key,
        success(data) {
            onSuccess?.(data);
        },
        fail(data, code) {
            console.error(`readValue fail, code: ${code}, data: ${data}`);
            onFail?.(data, code);
        }
    });
}

export function writeValue(key, value, cb) {
    storage.set({
        key,
        value,
        success() {
            cb?.(true);
        },
        fail(data, code) {
            console.error(`writeValue fail, code: ${code}, data: ${data}`);
            cb?.(false);
        }
    });
}

export function deleteValue(key, cb) {
    storage.delete({
        key,
        success() {
            cb?.(true);
        },
        fail(data, code) {
            console.error(`deleteValue fail, code: ${code}, data: ${data}`);
            cb?.(false);
        }
    });
}
