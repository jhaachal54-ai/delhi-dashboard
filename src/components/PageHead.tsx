"use client";

import { useLang, type TKey } from "@/lib/i18n";

// Localised page title + subtitle.
export function PageHead({ page }: { page: "weather" | "events" | "transport" }) {
  const { t } = useLang();
  return (
    <div className="page-head">
      <h2>{t(`head_${page}_t` as TKey)}</h2>
      <p>{t(`head_${page}_s` as TKey)}</p>
    </div>
  );
}
