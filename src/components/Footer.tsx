import Link from "next/link";

const currentYear = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-12">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <div className="text-base font-bold tracking-tight mb-2">
            MX <span className="text-emerald-700">Estate</span>
          </div>
          <p className="text-gray-600 max-w-xs">
            Property search for US expats in Mexico — verified realtors, clear
            legal info, English-first UX.
          </p>
        </div>

        <div>
          <div className="font-semibold text-gray-900 mb-2">For buyers</div>
          <ul className="space-y-1 text-gray-600">
            <li>
              <Link href="/properties" className="hover:text-black">
                Browse properties
              </Link>
            </li>
            <li>
              <Link href="/properties?type=sale" className="hover:text-black">
                Properties for sale
              </Link>
            </li>
            <li>
              <Link href="/properties?type=rent" className="hover:text-black">
                Properties for rent
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-gray-900 mb-2">For realtors</div>
          <ul className="space-y-1 text-gray-600">
            <li>
              <a
                href="mailto:partners@mx-estate.com?subject=Realtor%20partnership"
                className="hover:text-black"
              >
                Partner with us
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-gray-900 mb-2">Contact</div>
          <ul className="space-y-1 text-gray-600">
            <li>
              <a
                href="mailto:hello@mx-estate.com"
                className="hover:text-black"
              >
                hello@mx-estate.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {currentYear} MX Estate. All listings shown for informational purposes only.
      </div>
    </footer>
  );
}
