import React from "react";
import LegalPage from "@/components/legal/LegalPage";
import { useAppLang } from "@/lib/AppLanguageContext";

// Privacy Policy — all content comes from the 10-language legal catalog.
export default function PrivacyPolicy() {
  const { t } = useAppLang();
  const sections = [
    { heading: t("pp.s1h"), body: [t("pp.s1b")] },
    {
      heading: t("pp.s2h"),
      bullets: [t("pp.s2b1"), t("pp.s2b2"), t("pp.s2b3"), t("pp.s2b4"), t("pp.s2b5")],
    },
    {
      heading: t("pp.s3h"),
      bullets: [t("pp.s3b1"), t("pp.s3b2"), t("pp.s3b3"), t("pp.s3b4"), t("pp.s3b5"), t("pp.s3b6")],
    },
    { heading: t("pp.s4h"), body: [t("pp.s4b")] },
    { heading: t("pp.s5h"), body: [t("pp.s5b")] },
    { heading: t("pp.s6h"), body: [t("pp.s6b")] },
    { heading: t("pp.s7h"), body: [t("pp.s7b")] },
    { heading: t("pp.s8h"), body: [t("pp.s8b")] },
    { heading: t("pp.s9h"), body: [t("pp.s9b")] },
  ];

  return (
    <LegalPage
      eyebrow={t("legal.eyebrow")}
      title={t("pp.title")}
      intro={t("pp.intro")}
      sections={sections}
    />
  );
}