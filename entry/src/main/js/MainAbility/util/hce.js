import { numberOfSuks } from './dataStore';
import cardEmulation from '@ohos.nfc.cardEmulation';
import router from '../common/js/router';

const paymentAid = [
    '325041592E5359532E4444463031',
    'A0000000031010',
    'A0000000041010'
];

let sukIndex;
let sukData;

function initialize(index, suk) {
    sukIndex = index;
    sukData = suk;
    console.info(`initialize | ${sukIndex} | ${JSON.stringify(sukData)}`);
}

export function deleteHce() {
    sukIndex = sukData = null;
}

export function hce(index, suk) {
    console.info('initialize');
    initialize(index, suk);

    const hce = new cardEmulation.HceService();
    hce.stop('com.hmosdemos.lite_wearable.food_ticket_card');
    hce.start('com.hmosdemos.lite_wearable.food_ticket_card', paymentAid);

    hce.on('hceCmd', async (data, err) => {
        console.info(`hceCmd: ${data}`);

        if (err) {
            console.error(err);
            throw new Error('Error!');
        }

        if (sukData) {
            console.info('make payment');
            const response = [0x47, 0x4F, 0x4F, 0x44, 0x20, 0x4C, 0x55, 0x43, 0x4B, 0x20, 0x3A, 0x29, 0x90, 0x00];
            hce.transmit(response, () => {
            });

            deleteHce();
            console.info(`payment success remaining suk: ${numberOfSuks()}`);
        } else {
            console.info('route to no suk');
            router.go('pages/noSuk/noSuk');
        }
    });
}