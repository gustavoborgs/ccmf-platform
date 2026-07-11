import { NEVOA_TRACKING_SNIPPET_URL, NEVOA_TRACKING_TENANT } from "./config";

/** Snippet oficial Nevoa — carregado direto do backend, como no embed padrão. */
export function NevoaTracking() {
  return (
    <script
      src={NEVOA_TRACKING_SNIPPET_URL}
      data-tenant={NEVOA_TRACKING_TENANT}
      async
    />
  );
}
