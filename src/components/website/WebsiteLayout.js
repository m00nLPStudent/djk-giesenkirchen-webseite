import Header from "@/components/Header";

export default function WebsiteLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
