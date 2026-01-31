import router from '../../common/js/router';
import { consumeNextSuk } from '../../util/dataStore';
import { deleteHce, hce } from '../../util/hce';

export default {
    data: {
    },
    onInit() {
        consumeNextSuk((res) => {
            console.info(`consumeNextSuk res: ${JSON.stringify(res)}`);

            if (!res || res.done) {
                router.go('pages/noSuk/noSuk');
                return;
            }
            hce(res.suk);
            deleteHce();
        });
    },
    goBack(event) {
        if (event.direction === 'right') {
            router.go('pages/index/index');
        }
    }
};
