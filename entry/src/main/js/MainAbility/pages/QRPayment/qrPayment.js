import vibrator from '@system.vibrator';
import { consumeNextSuk } from '../../util/dataStore';
import router from '../../common/js/router';

let tick = null;

export default {
    data: {
        total: 20,
        remaining: 20,
        timeText: '00:20',
        qrValue: '123 456',
        percent: 100,
        qrCol: '#00D26A',
        qrBcol: '#040D09',
        running: false,
        vibDone: false,
        infoMessage: '',
        codeText: '',
        isActive: false
    },

    onInit() {
        this.isActive = true;
        this.reset();

        consumeNextSuk(({ done, suk }) => {

            if (!this.isActive) {
                return;
            };
            if (done) {
                this.cleanup();
                router.go('pages/noSuk/noSuk');
                return;
            }

            this.codeText = String(suk.code);
            this.qrValue = this.codeText;

            this.start();
        });
    },
    cleanup() {
        this.isActive = false;

        if (tick) {
            clearInterval(tick);
            tick = null;
        }
        this.running = false;
    },
    _consumeAndExit() {
        this.cleanup();
        consumeNextSuk(() => {
            router.go('pages/index/index' );
        });
    },
    goBack(event) {
        if (event.direction === 'right') {
            this.cleanup();
            router.go('pages/index/index');
        }
    },
    start() {
        if (!this.isActive) {
            return;
        };
        if (this.running) {
            return;
        };
        if (this.remaining <= 0) {
            this.reset();
        };

        this.running = true;
        this._render();

        tick = setInterval(() => {

            if (!this.isActive) {
                clearInterval(tick);
                tick = null;
                return;
            }

            if (this.remaining <= 0) {
                this._finish(false);
                this._consumeAndExit();
                return;
            }

            this.remaining -= 1;

            if (!this.vibDone && this.remaining === 5) {
                try { vibrator.vibrate({ mode: 'short' }); } catch (e) {}
                this.vibDone = true;
            }

            this._render();

            if (this.remaining === 0) {
                this._finish(true); //
                this._consumeAndExit();
            }
        }, 1000);
    },

    _render() {
        const m = Math.floor(this.remaining / 60);
        const s = this.remaining % 60;
        const mm = m < 10 ? `0 ${m}` : String(m);
        const ss = s < 10 ? `0 ${s}` : String(s);
        this.timeText = `${mm}:${ss}`;

        this.percent = Math.floor((this.remaining / this.total) * 100);
    },

    _finish(doVibrate = true) {
        if (tick) {
            clearInterval(tick);
            tick = null;
        }
        this.running = false;

        this.remaining = 0;
        this.timeText = '00:00';
        this.percent = 0;

        if (doVibrate && this.isActive) {
            try { vibrator.vibrate({ mode: 'long' }); } catch (e) {}
        }
    },

    pause() {
        if (tick) {
            clearInterval(tick);
            tick = null;
        }
        this.running = false;
    },

    reset() {
        this.pause();
        this.total = 20;
        this.remaining = 20;
        this.timeText = '00:20';
        this.percent = 100;
        this.vibDone = false;
    }
};
