import { numberOfSuks, saveSuksArray } from '../../util/dataStore';
import { Builder, Message, P2pClient } from '../../wearenginesdk/wearengine';
import { PHONE_APP_FINGERPRINT, PHONE_APP_PACKAGE_NAME } from '../../constants/constants.js';
import brightness from '@system.brightness';
import file from '@system.file';
import router from '@ohos.router';

const p2pClient = new P2pClient();
const messageClient = new Message();
const builderClient = new Builder();

export default {
    data: {
        receiveMessage: '',
        receivedMessage: '',
        infoMessage: '',
        source: 'internal://app/',
        hasSuk: true,
        sukCount: 0
    },
    onInit() {
        this.keepScreenOn();
        p2pClient.setPeerPkgName(PHONE_APP_PACKAGE_NAME);
        p2pClient.setPeerFingerPrint(PHONE_APP_FINGERPRINT);
        this.registerMessage();
        this.refreshSukState();
    },
    refreshSukState() {
        numberOfSuks((count) => {
            this.sukCount = count;
            this.hasSuk = count > 0;
        });
    },
    normalizeReceivedUri(nameOrUri) {
        if (!nameOrUri) {
            return '';
        }
        if (nameOrUri.startsWith('internal://')) {
            return nameOrUri;
        }
        const cleaned = nameOrUri.startsWith('/') ? nameOrUri.slice(1) : nameOrUri;
        return `internal://app/ ${cleaned}`;
    },
    goNFC() {
        if (this.hasSuk) {
            router.replace({ uri: 'pages/nfcpayment/nfcpayment' });
        } else {
            router.replace({ uri: 'pages/noSuk/noSuk' });
        }
    },
    goQR() {
        if (this.hasSuk) {
            router.replace({ uri: 'pages/qrpayment/qrpayment' });
        } else {
            router.replace({ uri: 'pages/noSuk/noSuk' });
        }
    },
    registerMessage() {
        const that = this;
        p2pClient.registerReceiver({
            onSuccess() {
                that.receiveMessage = 'Message receive success';
                console.info('[P2P] Receiver registered successfully');
            },
            onFailure() {
                that.receiveMessage = 'Message receive fail';
                console.error('[P2P] Receiver registration failed');
            },
            onReceiveMessage(data) {
                console.info('[P2P] onReceiveMessage called');
                console.info(`[P2P] data type: ${typeof data}`);
                console.info(`[P2P] data value: ${JSON.stringify(data).substring(0, 200)}`);

                if (data && typeof data === 'object' && data.isFileType) {
                    that.receiveMessage = `Receive file: ${data.name}`;
                    console.info(`[P2P] File received: ${data.name}`);
                    const uri = that.normalizeReceivedUri(data.name);

                    file.readText({
                        uri,
                        success: (res) => {
                            console.info('[P2P] File content length: ' + (res.text ? res.text.length : 0));
                            that.parseSukData(res.text);
                        },
                        fail: (d, c) => {
                            console.error(`[P2P] readText fail: ${c}, data: ${d}`);
                            that.infoMessage = `Read file failed: ${c}`;
                        }
                    });

                } else {
                    let messageStr = '';

                    if (typeof data === 'string') {
                        messageStr = data;
                        console.info(`[P2P] Data is string, length ${data.length}`);
                    } else if (data && typeof data === 'object') {
                        console.info(`[P2P] Data is object with keys: ${Object.keys(data).join(', ')}`);
                        if (data.message !== undefined) {
                            messageStr = String(data.message);
                            console.info('[P2P] Using data.message');
                        } else if (data.data !== undefined) {
                            messageStr = String(data.data);
                            console.info('[P2P] Using data.data');
                        } else if (data.name !== undefined) {
                            messageStr = String(data.name);
                            console.info('[P2P] Using data.name');
                        } else {
                            messageStr = JSON.stringify(data);
                            console.info('[P2P] Stringified whole object');
                        }
                    } else if (data !== null && data !== undefined) {
                        messageStr = String(data);
                        console.info(`[P2P] Converted to string: ${typeof data}`);
                    }

                    console.info(`[P2P] Final messageStr length: ${messageStr.length}`);
                    console.info(`[P2P] messageStr preview ${messageStr.substring(0, 100)}`);

                    that.receiveMessage = `Msg (${messageStr.length} chars)`;
                    that.parseSukData(messageStr);
                }
            }
        });
    },

    parseSukData(jsonStr) {
        const that = this;

        console.info(`[parseSukData] Called with length: ${(jsonStr ? jsonStr.length : 0)}`);

        if (!jsonStr || jsonStr.trim() === '') {
            console.info('[parseSukData] Empty message received');
            that.infoMessage = 'Empty message';
            return;
        }
        console.info(`[parseSukData] Content: ${jsonStr.substring(0, 200)}`);

        try {
            const parsed = JSON.parse(jsonStr);
            console.info(`[parseSukData] JSON parsed successfully, isArray: ${Array.isArray(parsed)}`);

            if (Array.isArray(parsed)) {
                console.info(`[parseSukData] Array length: ${parsed.length}`);
                if (parsed.length > 0) {
                    console.info(`[parseSukData] First item: ${JSON.stringify(parsed[0])}`);
                    console.info(`[parseSukData] Has sukId: ${(parsed[0].sukId !== undefined)}`);
                    console.info(`[parseSukData] Has code: ${(parsed[0].code !== undefined)}`);
                }

                if (parsed.length > 0 && (parsed[0].sukId !== undefined || parsed[0].code !== undefined)) {
                    console.info('[parseSukData] Saving SUK array...');
                    saveSuksArray(parsed, (ok) => {
                        console.info(`[parseSukData] saveSuksArray result: ${ok}`);
                        that.infoMessage = ok ? `Imported ${parsed.length} SUKs` : 'Import failed';
                        that.refreshSukState();
                    });
                    return;
                } else {
                    console.info('[parseSukData] Array does not look like SUK data');
                }
            }

            that.infoMessage = `Received: ${jsonStr.substring(0, 50)}...`;

        } catch (e) {
            console.error(`[parseSukData] JSON parse error: ${e.message}`);
            that.infoMessage = `Parse error: ${e.message}`;
        }
    },
    unregisterMessage() {
        const that = this;
        p2pClient.unregisterReceiver({
            onSuccess() {
                that.infoMessage = 'Stop receiving messages is sent';
            }
        });
    },
    sendMessage() {
        builderClient.setDescription('hello wearEngine');
        messageClient.builder = builderClient;
        this.infoMessage = 'Send message button click';
        console.info(`testBuilder: ${messageClient.getData()}`);

        const that = this;
        p2pClient.send(messageClient, {
            onSuccess() {
                that.infoMessage = 'Message sent successfully';
            },
            onFailure() {
                that.infoMessage = 'Failed to send message';
            },
            onSendResult(resultCode) {
                console.info(`On send result data: ${resultCode.data}, result code ${resultCode.data}`);

            },
            onSendProgress(progressNum) {
                console.info(`Send Progress: ${progressNum}`);
            }
        });
    },
    keepScreenOn() {
        brightness.setKeepScreenOn({
            keepScreenOn: true,
            success() {
                console.info('screen on success');
            },
            fail() {
                console.info('screen on failed');
            }
        });
        brightness.setValue({
            value: 180,
            success() {
                console.info('handling set brightness success.');
            },
            fail(data, code) {
                console.error(`Handling set brightness value fail, code:: ${code}, result code ${data}`);

            }
        });
    },

    sendFile() {
        this.infoMessage = 'Send file button click';
        const testFile = {
            'name': 'internal://app/rawfile/file.txt',
            'mode': 'text',
            'mode2': 'RW'
        };
        const that = this;

        builderClient.setPayload(testFile);
        messageClient.builder = builderClient;
        p2pClient.send(messageClient, {
            onSuccess() {
                that.infoMessage = 'File sent successfully';
            },
            onFailure() {
                that.infoMessage = 'Failed to send file';
            },
            onSendResult(resultCode) {
                console.info(`Send file result data: ${resultCode.data}, code: ${resultCode.code}`);
                if (resultCode.code === 207) {
                    that.infoMessage = 'Success sent file';
                    return;
                }
                that.infoMessage = resultCode.code;
            },
            onSendProgress(count) {
                console.info(`Progress: ${count}`);
                that.infoMessage = `Progress: ${count}`;
            }
        });
    },
    ping() {
        const that = this;
        that.infoMessage = 'Ping correct APP';
        p2pClient.ping({
            onSuccess() {
                that.infoMessage = `${that.infoMessage}success`;
            },
            onFailure() {
                that.infoMessage = `${that.infoMessage}fail`;
            },
            onPingResult(resultCode) {
                that.infoMessage = `result code${resultCode.code}, the app already have installed`;
            }
        });
    }
};
