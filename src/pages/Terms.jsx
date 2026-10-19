import React from "react";
import LegalPage from "@/components/legal/LegalPage";
import { useAppLang } from "@/lib/AppLanguageContext";

// Terms & Conditions — all content comes from the 10-language legal catalog.
export default function Terms() {
  const { t } = useAppLang();
  const sections = [
    { heading: t("tc.s1h"), body: [t("tc.s1b")] },
    { heading: t("tc.s2h"), body: [t("tc.s2b")] },
    { heading: t("tc.s3h"), body: [t("tc.s3b")] },
    {
      heading: t("tc.s4h"),
      bullets: [t("tc.s4b1"), t("tc.s4b2"), t("tc.s4b3")],
    },
    {
      heading: t("tc.s5h"),
      bullets: [t("tc.s5b1"), t("tc.s5b2"), t("tc.s5b3")],
    },
    { heading: t("tc.s6h"), body: [t("tc.s6b")] },
    {
      heading: t("tc.s7h"),
      bullets: [t("tc.s7b1"), t("tc.s7b2"), t("tc.s7b3"), t("tc.s7b4")],
    },
    {
      heading: t("tc.s8h"),
      bullets: [t("tc.s8b1"), t("tc.s8b2"), t("tc.s8b3"), t("tc.s8b4")],
    },
    { heading: t("tc.s9h"), body: [t("tc.s9b")] },
    { heading: t("tc.s10h"), body: [t("tc.s10b")] },
    { heading: t("tc.s11h"), body: [t("tc.s11b")] },
    { heading: t("tc.s12h"), body: [t("tc.s12b")] },
  ];

  return (
    <LegalPage
      eyebrow={t("legal.eyebrow")}
      title={t("tc.title")}
      intro={t("tc.intro")}
      sections={sections}
    />
  );
}