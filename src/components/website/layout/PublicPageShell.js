export default function PublicPageShell({ children, width = "max-w-7xl", className = "" }) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-transparent px-4 pt-28 pb-20 text-white sm:px-6 md:pt-52 md:pb-24">
      <div className={`mx-auto w-full ${width} ${className}`}>{children}</div>
    </main>
  );
}
