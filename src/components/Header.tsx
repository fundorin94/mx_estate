import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight hover:opacity-80"
        >
          MX <span className="text-emerald-700">Estate</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-4 text-sm">
          <Link
            href="/properties"
            className="px-2 py-1 rounded text-gray-700 hover:text-black hover:bg-gray-100"
          >
            Properties
          </Link>
          <Link
            href="/properties?type=sale"
            className="hidden sm:inline-block px-2 py-1 rounded text-gray-700 hover:text-black hover:bg-gray-100"
          >
            Buy
          </Link>
          <Link
            href="/properties?type=rent"
            className="hidden sm:inline-block px-2 py-1 rounded text-gray-700 hover:text-black hover:bg-gray-100"
          >
            Rent
          </Link>
          <a
            href="mailto:partners@mx-estate.com?subject=Realtor%20partnership"
            className="ml-1 sm:ml-2 px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
          >
            For realtors
          </a>
        </nav>
      </div>
    </header>
  );
}
