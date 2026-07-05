export default function SponsorGrid({ children }) {
  return (
    <div className="mt-8 grid min-w-0 grid-cols-1 gap-5 md:mt-10 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
      {children}
    </div>
  );
}
