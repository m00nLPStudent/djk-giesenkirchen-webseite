import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "@/styles/fupa-widget.css";
import "@/styles/football-de-widget.css";

export default function WebsiteLayout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
