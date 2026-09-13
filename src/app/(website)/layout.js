import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConsentProvider from "@/components/website/consent/ConsentProvider";
import "@/styles/fupa-widget.css";
import "@/styles/football-de-widget.css";

export default function WebsiteLayout({ children }) {
  return (
    <ConsentProvider>
      <a href="#main-content" className="public-skip-link">
        Zum Hauptinhalt springen
      </a>
      <Header />
      <div className="public-site-frame min-h-screen">{children}</div>
      <Footer />
    </ConsentProvider>
  );
}
