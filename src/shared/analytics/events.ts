type AnalyticsValue =
  | string
  | number
  | boolean
  | null
  | AnalyticsValue[]
  | { [key: string]: AnalyticsValue | undefined };
type AnalyticsParams = Record<string, AnalyticsValue | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (
      command: "config" | "event",
      target: string,
      params?: AnalyticsParams,
    ) => void;
  }
}

function cleanParams(params: AnalyticsParams): AnalyticsParams {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as AnalyticsParams;
}

export function centsToAnalyticsValue(cents: number): number {
  return Number((cents / 100).toFixed(2));
}

export function registrationFeeItem(feeCents: number) {
  const price = centsToAnalyticsValue(feeCents);

  return [
    {
      item_id: "registration_fee",
      item_name: "Taxa de inscrição CCMF",
      price,
      quantity: 1,
    },
  ];
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;

  const cleaned = cleanParams(params);
  if (window.gtag) {
    window.gtag("event", eventName, cleaned);
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(["event", eventName, cleaned]);
}

export function trackPageView(path: string, measurementId: string) {
  if (typeof window === "undefined") return;

  const params = {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  };

  if (window.gtag) {
    window.gtag("config", measurementId, params);
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(["config", measurementId, params]);
}

export function trackOnce(key: string, eventName: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;

  const storageKey = `ccmf_analytics_${key}`;
  if (window.localStorage.getItem(storageKey)) return;

  trackEvent(eventName, params);
  window.localStorage.setItem(storageKey, "1");
}

export function trackPurchaseOnce({
  protocol,
  feeCents,
  paymentMethod,
}: {
  protocol: string;
  feeCents: number;
  paymentMethod?: string;
}) {
  const value = centsToAnalyticsValue(feeCents);

  trackOnce(`purchase_${protocol}`, "purchase", {
    transaction_id: protocol,
    currency: "BRL",
    value,
    payment_type: paymentMethod,
    items: registrationFeeItem(feeCents),
  });
}
