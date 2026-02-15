import { useTranslation } from "react-i18next";

export function SEO() {
  const { t, i18n } = useTranslation();

  const title = t("app.landing.title");
  const description = t("app.landing.subtitle");
  const keywords = t("app.seo.keywords", {
    defaultValue: "Heda, health, dashboard, privacy, insights",
  });
  const siteUrl = "https://heda.tosc.fr/";

  return (
    <>
      <title>{`${title} | Your Health Trends`}</title>
      <meta name="title" content={`${title} | Your Health Trends`} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta
        property="og:locale"
        content={i18n.language === "fr" ? "fr_FR" : "en_US"}
      />

      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={siteUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
    </>
  );
}
