/**
 * ZENO-ADS.JS - Adsterra 320x50 Banner Ad Module
 * Includes referrer and Monetag verification meta tags.
 */
(function () {
    const ZenoAds = {
        loaded: false,

        init() {
            window.ZenoAds = this;
            this.injectRequiredMetaTags();

            const boot = () => {
                this.mountAdSlotUnderPublicLink();
                this.watchScreen3Visibility();
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', boot);
            } else {
                boot();
            }
        },

        // Adds both referrer and monetag meta tags to <head>
        injectRequiredMetaTags() {
            if (!document.head) return;

            const tags = [
                { name: 'referrer', content: 'no-referrer-when-downgrade' },
                { name: 'monetag', content: '41dc7553f45020928d845d4e715b78e8' }
            ];

            tags.forEach(t => {
                let meta = document.querySelector(`meta[name="${t.name}"]`);
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = t.name;
                    document.head.appendChild(meta);
                }
                meta.content = t.content;
            });
        },

        mountAdSlotUnderPublicLink() {
            const publicBanner = document.getElementById('publicLinkBanner');
            if (!publicBanner || document.getElementById('zenoAdsterraBar')) return;

            const adBar = document.createElement('div');
            adBar.id = 'zenoAdsterraBar';
            adBar.className = "w-full py-1.5 px-2 bg-black/40 border-t border-white/10 flex items-center justify-center overflow-hidden";
            adBar.innerHTML = `
                <div id="zenoAdsterraFrameWrap" style="width:320px; max-width:100%; height:50px; display:flex; align-items:center; justify-content:center; overflow:hidden; border-radius:10px; background:rgba(255,255,255,0.03);"></div>
            `;

            publicBanner.insertAdjacentElement('afterend', adBar);
        },

        watchScreen3Visibility() {
            const screen3 = document.getElementById('screen3');
            if (!screen3) return;

            const tryRender = () => {
                if (!this.loaded && !screen3.classList.contains('hidden')) {
                    this.renderAdsterraBanner();
                }
            };

            tryRender();

            const observer = new MutationObserver(() => {
                tryRender();
                if (this.loaded) observer.disconnect();
            });
            observer.observe(screen3, { attributes: true, attributeFilter: ['class'] });
        },

        renderAdsterraBanner() {
            const wrap = document.getElementById('zenoAdsterraFrameWrap');
            if (!wrap || this.loaded) return;
            this.loaded = true;

            const iframe = document.createElement('iframe');
            iframe.title = 'Advertisement';
            iframe.width = '320';
            iframe.height = '50';
            iframe.scrolling = 'no';
            iframe.frameBorder = '0';
            iframe.referrerPolicy = 'no-referrer-when-downgrade';
            iframe.style.cssText = 'width:320px; height:50px; max-width:100%; border:0; overflow:hidden; display:block; background:transparent;';

            wrap.innerHTML = '';
            wrap.appendChild(iframe);

            const adHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="referrer" content="no-referrer-when-downgrade" />
<meta name="monetag" content="41dc7553f45020928d845d4e715b78e8">
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 320px;
    height: 50px;
    overflow: hidden;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
</head>
<body>
<script>
  atOptions = {
    'key' : 'e180b69637e2642e6c185eee147e8d00',
    'format' : 'iframe',
    'height' : 50,
    'width' : 320,
    'params' : {}
  };
<\/script>
<script src="https://bauval.org/22/e180b69637e2642e6c185eee147e8d00"><\/script>
</body>
</html>`;

            try {
                const doc = iframe.contentWindow.document;
                doc.open();
                doc.write(adHtml);
                doc.close();
            } catch (e) {
                iframe.srcdoc = adHtml;
            }
        }
    };

    ZenoAds.init();
})();
