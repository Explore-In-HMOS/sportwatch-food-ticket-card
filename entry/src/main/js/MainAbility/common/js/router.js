import router from '@ohos.router';

export default {

    go(to, params) {
        router.replace({
            uri: to,
            params: params
        });
    }
};