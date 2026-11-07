import { PixelSettings, PixelEventLog } from '../types';

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    snaptr?: any;
    gtag?: any;
    dataLayer?: any[];
  }
}

class PixelService {
  private logs: PixelEventLog[] = [];
  private listeners: ((logs: PixelEventLog[]) => void)[] = [];

  constructor() {
    // Load existing logs from session if any
    try {
      const stored = sessionStorage.getItem('pixel_event_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch {
      this.logs = [];
    }
  }

  public getLogs(): PixelEventLog[] {
    return [...this.logs];
  }

  public getTestEventCode(): string {
    if (typeof window === 'undefined') return '';
    try {
      const url = new URL(window.location.href);
      const urlCode =
        url.searchParams.get('test_event_code') || url.searchParams.get('tt_test_code');
      if (urlCode) {
        sessionStorage.setItem('tiktok_test_event_code', urlCode.trim());
        return urlCode.trim();
      }
      return sessionStorage.getItem('tiktok_test_event_code') || '';
    } catch {
      return '';
    }
  }

  public setTestEventCode(code: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (code && code.trim()) {
        sessionStorage.setItem('tiktok_test_event_code', code.trim());
      } else {
        sessionStorage.removeItem('tiktok_test_event_code');
      }
    } catch {
      // ignore
    }
  }

  public clearLogs(): void {
    this.logs = [];
    sessionStorage.removeItem('pixel_event_logs');
    this.notify();
  }

  public subscribe(listener: (logs: PixelEventLog[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener([...this.logs]));
    try {
      sessionStorage.setItem('pixel_event_logs', JSON.stringify(this.logs.slice(0, 50)));
    } catch {
      // ignore
    }
  }

  private addLog(pixelType: PixelEventLog['pixelType'], eventName: string, payload: Record<string, any>) {
    const entry: PixelEventLog = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      pixelType,
      eventName,
      payload,
    };
    this.logs.unshift(entry);
    if (this.logs.length > 60) this.logs.pop();
    this.notify();
  }

  /**
   * Initializes or refreshes tracking scripts in document.head
   */
  public syncPixels(settings: PixelSettings) {
    if (typeof window === 'undefined') return;

    // 1. Facebook Pixel
    if (settings.facebookEnabled && settings.facebookPixelId.trim()) {
      const id = settings.facebookPixelId.trim();
      if (!window.fbq) {
        (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s?.parentNode?.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      }
      try {
        if (window.fbq) {
          window.fbq('init', id);
          window.fbq('track', 'PageView');
          this.addLog('facebook', 'PageView', { pixelId: id });
        }
      } catch (err) {
        console.warn('Facebook Pixel init notice:', err);
      }
    }

    // 2. TikTok Pixel
    if (settings.tiktokEnabled && settings.tiktokPixelId.trim()) {
      const id = settings.tiktokPixelId.trim();
      if (!window.ttq) {
        (function (w: any, d: any, t: any) {
          w.TiktokAnalyticsObject = t;
          var ttq = (w[t] = w[t] || []);
          ttq.methods = [
            'page',
            'track',
            'identify',
            'instances',
            'debug',
            'on',
            'off',
            'once',
            'ready',
            'alias',
            'group',
            'enableCookie',
            'disableCookie',
            'holdConsent',
            'revokeConsent',
            'grantConsent',
          ];
          ttq.setAndDefer = function (t: any, e: any) {
            t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };
          for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
          ttq.instance = function (t: any) {
            for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
            return e;
          };
          ttq.load = function (e: any, n: any) {
            var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
            (ttq._i = ttq._i || {}), (ttq._i[e] = []), (ttq._i[e]._u = i);
            ttq._t = ttq._t || {};
            ttq._t[e] = +new Date();
            ttq._o = ttq._o || {};
            ttq._o[e] = n || {};
            if (!document.querySelector('script[src*="' + e + '"]')) {
              var o = document.createElement('script');
              (o.type = 'text/javascript'), (o.async = !0), (o.src = i + '?sdkid=' + e + '&lib=' + t);
              var a = document.getElementsByTagName('script')[0];
              if (a && a.parentNode) {
                a.parentNode.insertBefore(o, a);
              } else {
                document.head.appendChild(o);
              }
            }
          };
        })(window, document, 'ttq');
      }
      try {
        if (window.ttq) {
          window.ttq.load(id);
          window.ttq.page();
          this.addLog('tiktok', 'Page', { pixelId: id, status: 'Active & Verified' });
        }
      } catch (err) {
        console.warn('TikTok Pixel notice:', err);
      }
    }

    // 3. Snapchat Pixel
    if (settings.snapchatEnabled && settings.snapchatPixelId.trim()) {
      const id = settings.snapchatPixelId.trim();
      if (!window.snaptr) {
        (function (e: any, t: any, n: any) {
          if (e.snaptr) return;
          var a: any = (e.snaptr = function () {
            a.handleRequest ? a.handleRequest.apply(a, arguments) : a.queue.push(arguments);
          });
          a.queue = [];
          var s = 'script';
          var r = t.createElement(s);
          r.async = !0;
          r.src = n;
          var u = t.getElementsByTagName(s)[0];
          u?.parentNode?.insertBefore(r, u);
        })(window, document, 'https://sc-static.net/scevent.min.js');
      }
      try {
        if (window.snaptr) {
          window.snaptr('init', id);
          window.snaptr('track', 'PAGE_VIEW');
          this.addLog('snapchat', 'PAGE_VIEW', { pixelId: id });
        }
      } catch (err) {
        console.warn('Snapchat Pixel notice:', err);
      }
    }

    // 4. Google Analytics
    if (settings.googleEnabled && settings.googleAnalyticsId.trim()) {
      const id = settings.googleAnalyticsId.trim();
      const existing = document.getElementById('ga-script');
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'ga-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function () {
          window.dataLayer?.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', id);
        this.addLog('google', 'page_view', { measurementId: id });
      }
    }
  }

  /**
   * Tracks an event across all active platforms and logs it
   */
  public track(
    eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase',
    payload: Record<string, any>,
    settings: PixelSettings
  ) {
    // Normalize currency for pixel networks (Meta, TikTok, Snapchat expect 3-letter ISO code like 'MAD')
    const rawCurrency = payload.currency || 'د.م';
    const normalizedCurrency =
      rawCurrency === 'د.م' || rawCurrency === 'DH' || rawCurrency === 'درهم'
        ? 'MAD'
        : rawCurrency;

    const normalizedPayload = {
      ...payload,
      currency: normalizedCurrency,
    };

    // 1. Meta / Facebook Pixel
    if (settings.facebookEnabled && settings.facebookPixelId?.trim()) {
      try {
        if (window.fbq) {
          window.fbq('track', eventName, normalizedPayload);
        }
      } catch (e) {
        console.warn('fbq track error', e);
      }
      this.addLog('facebook', eventName, normalizedPayload);
    }

    // 2. TikTok Pixel
    if (settings.tiktokEnabled && settings.tiktokPixelId?.trim()) {
      try {
        const contentId = payload.content_ids?.[0] || payload.content_id || 'prod-survette-amelia';
        const contentName = payload.content_name || 'سورفيت أميليا (Survette Amélia)';
        const val = Number(payload.value || 0);
        const qty = Number(payload.num_items || payload.quantity || 1);

        const tiktokPayload: Record<string, any> = {
          content_id: String(contentId),
          content_type: 'product',
          content_name: contentName,
          quantity: qty,
          price: val > 0 && qty > 0 ? Number((val / qty).toFixed(2)) : val,
          value: val,
          currency: normalizedCurrency,
          contents: [
            {
              content_id: String(contentId),
              content_name: contentName,
              content_type: 'product',
              quantity: qty,
              price: val > 0 && qty > 0 ? Number((val / qty).toFixed(2)) : val,
            },
          ],
        };

        if (payload.order_id) {
          tiktokPayload.order_id = String(payload.order_id);
        }

        // Test event code support (from payload or session)
        const testEventCode = payload.test_event_code || this.getTestEventCode();
        const options: Record<string, any> = {};
        if (testEventCode) {
          options.test_event_code = testEventCode;
          tiktokPayload.test_event_code = testEventCode;
        }
        if (payload.event_id || payload.order_id) {
          options.event_id = String(payload.event_id || payload.order_id);
        }

        // Advanced Matching identification with Moroccan phone normalization
        if (payload.customer_phone || payload.customer_name) {
          try {
            if (window.ttq?.identify) {
              let phoneStr = payload.customer_phone ? String(payload.customer_phone).trim() : '';
              if (phoneStr.startsWith('0') && phoneStr.length === 10) {
                phoneStr = '+212' + phoneStr.substring(1);
              } else if (!phoneStr.startsWith('+') && phoneStr.length >= 9) {
                phoneStr = '+212' + phoneStr;
              }
              window.ttq.identify({
                phone_number: phoneStr || undefined,
                name: payload.customer_name ? String(payload.customer_name).trim() : undefined,
              });
            }
          } catch {
            // ignore
          }
        }

        if (window.ttq) {
          if (eventName === 'PageView') {
            window.ttq.page();
          } else {
            const ttEventMap: Record<string, string> = {
              ViewContent: 'ViewContent',
              AddToCart: 'AddToCart',
              InitiateCheckout: 'InitiateCheckout',
              Purchase: 'CompletePayment',
            };
            const ttEvent = ttEventMap[eventName] || eventName;
            if (Object.keys(options).length > 0) {
              window.ttq.track(ttEvent, tiktokPayload, options);
            } else {
              window.ttq.track(ttEvent, tiktokPayload);
            }
          }
        }
      } catch (e) {
        console.warn('ttq track error', e);
      }
      this.addLog(
        'tiktok',
        eventName === 'Purchase' ? 'CompletePayment (Purchase)' : eventName,
        { ...normalizedPayload, pixelId: settings.tiktokPixelId.trim() }
      );
    }

    // 3. Snapchat Pixel
    if (settings.snapchatEnabled && settings.snapchatPixelId?.trim()) {
      try {
        const snapEventMap: Record<string, string> = {
          PageView: 'PAGE_VIEW',
          ViewContent: 'VIEW_CONTENT',
          AddToCart: 'ADD_CART',
          InitiateCheckout: 'START_CHECKOUT',
          Purchase: 'PURCHASE',
        };
        const snapEvent = snapEventMap[eventName] || eventName;
        if (window.snaptr) {
          window.snaptr('track', snapEvent, normalizedPayload);
        }
      } catch (e) {
        console.warn('snaptr track error', e);
      }
      this.addLog('snapchat', eventName, normalizedPayload);
    }

    // 4. Google Analytics
    if (settings.googleEnabled && settings.googleAnalyticsId?.trim()) {
      try {
        const gaEventMap: Record<string, string> = {
          PageView: 'page_view',
          ViewContent: 'view_item',
          AddToCart: 'add_to_cart',
          InitiateCheckout: 'begin_checkout',
          Purchase: 'purchase',
        };
        const gaEvent = gaEventMap[eventName] || eventName;
        if (window.gtag) {
          window.gtag('event', gaEvent, normalizedPayload);
        }
      } catch (e) {
        console.warn('gtag track error', e);
      }
      this.addLog('google', eventName, normalizedPayload);
    }
  }
}

export const pixelService = new PixelService();
