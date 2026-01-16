/**
 * RoofCheck Widget Loader
 *
 * Usage:
 * <div id="roofcheck-widget"></div>
 * <script src="https://app.roofcheck.com/widget.js" data-roofer-key="rk_xxxxx"></script>
 */

(function () {
  'use strict';

  // Get script element and config
  const currentScript = document.currentScript;
  const rooferKey = currentScript?.getAttribute('data-roofer-key');
  const containerId = currentScript?.getAttribute('data-container') || 'roofcheck-widget';

  if (!rooferKey) {
    console.error('[RoofCheck] Missing data-roofer-key attribute');
    return;
  }

  // Get the base URL from the script src
  const scriptSrc = currentScript?.src || '';
  const baseUrl = scriptSrc.replace(/\/widget\.js.*$/, '') || 'https://app.roofcheck.com';

  // Configuration
  const config = {
    rooferKey: rooferKey,
    containerId: containerId,
    baseUrl: baseUrl,
  };

  // Initialize when DOM is ready
  function init() {
    const container = document.getElementById(config.containerId);

    if (!container) {
      console.error(`[RoofCheck] Container element #${config.containerId} not found`);
      return;
    }

    // Get current domain for validation
    const currentDomain = window.location.hostname;

    // Request embed token
    fetch(`${config.baseUrl}/api/embed/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rooferKey: config.rooferKey,
        domain: currentDomain,
      }),
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (data) {
            throw new Error(data.error || 'Failed to initialize widget');
          });
        }
        return response.json();
      })
      .then(function (data) {
        createWidget(container, data.token, data.config);
      })
      .catch(function (error) {
        console.error('[RoofCheck] Initialization error:', error.message);
        container.innerHTML =
          '<div style="padding: 20px; text-align: center; color: #666;">' +
          'Unable to load roof report widget. Please try again later.' +
          '</div>';
      });
  }

  // Create the widget iframe
  function createWidget(container, token, widgetConfig) {
    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; min-height: 400px;';

    // Create iframe
    const iframe = document.createElement('iframe');
    const iframeSrc = `${config.baseUrl}/embed/${config.rooferKey}?token=${encodeURIComponent(token)}`;

    iframe.src = iframeSrc;
    iframe.style.cssText =
      'width: 100%; border: none; min-height: 400px; display: block;';
    iframe.setAttribute('title', 'RoofCheck Roof Report Widget');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('allow', 'geolocation');

    // Handle messages from iframe
    window.addEventListener('message', function (event) {
      // Validate origin
      if (!event.origin.includes(new URL(config.baseUrl).hostname)) {
        return;
      }

      // Validate message source
      if (!event.data || event.data.source !== 'roofcheck-widget') {
        return;
      }

      var message = event.data;

      // Handle resize
      if (message.event === 'resize' && message.height) {
        iframe.style.height = message.height + 'px';
      }

      // Dispatch custom events for integrations (GA, Meta Pixel, etc.)
      if (message.event) {
        var customEvent = new CustomEvent('roofcheck:' + message.event, {
          detail: message,
          bubbles: true,
        });
        container.dispatchEvent(customEvent);

        // Also dispatch to window for easier listening
        window.dispatchEvent(customEvent);
      }
    });

    wrapper.appendChild(iframe);
    container.innerHTML = '';
    container.appendChild(wrapper);
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
