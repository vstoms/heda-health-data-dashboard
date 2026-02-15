import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export function SEO() {
  const { t, i18n } = useTranslation();

  const title = t("app.landing.title");
  const description = t("app.landing.subtitle");
  const keywords = t("app.seo.keywords", {
    defaultValue: "Heda, health, dashboard, privacy, insights",
  });
  const siteUrl = "https://heda.tosc.fr/";

  useEffect(() => {
    document.title = `${title} | Your Health Trends`;

    const updateMeta = (selector: string, content: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    };

    updateMeta('meta[name="title"]', `${title} | Your Health Trends`);
    updateMeta('meta[name="description"]', description);
    updateMeta('meta[name="keywords"]', keywords);
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:url"]', siteUrl);
    updateMeta('meta[property="og:locale"]', i18n.language === "fr" ? "fr_FR" : "en_US");
    updateMeta('meta[property="twitter:title"]', title);
    updateMeta('meta[property="twitter:description"]', description);
    updateMeta('meta[property="twitter:url"]', siteUrl);
  }, [title, description, keywords, i18n.language, siteUrl]);

  return null;
}
