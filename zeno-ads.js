/**
 * ZENO-ADS.JS - Adsterra 320x50 Banner Ad Module
 * Renders the Adsterra banner directly underneath the Public Link bar.
 */
(function () {
    const ZenoAds = {
        loaded: false,

        init() {
            window.ZenoAds = this;
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

        // Loads the ad as soon as the main workspace becomes visible so impressions register properly
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
            iframe.style.cssText = 'width:320px; height:50px; max-width:100%; border:0; overflow:hidden; display:block; background:transparent;';

            wrap.innerHTML = '';
            wrap.appendChild(iframe);

            const adHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
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
