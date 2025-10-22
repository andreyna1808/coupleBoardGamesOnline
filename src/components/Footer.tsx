import { useI18n } from "../../lib/i18n";

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <p>
        © {new Date().getFullYear()} {t("title")}. {t("footer.allReserved")}.
      </p>
      <p>
        {t("footer.developedBy")}{" "}
        <a
          className="user-link"
          href="https://github.com/andreyna1808"
          target="_blank"
        >
          Andreyna Carvalho
        </a>
      </p>
    </footer>
  );
}
