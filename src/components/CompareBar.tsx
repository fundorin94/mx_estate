import Link from "next/link";
import { cookies } from "next/headers";
import { COMPARE_COOKIE, MAX_COMPARE, parseCompare } from "@/lib/compare";
import { clearCompare } from "@/app/actions/compare";

export function CompareBar() {
  const ids = parseCompare(cookies().get(COMPARE_COOKIE)?.value);
  if (ids.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-black text-white px-4 py-2 rounded-full shadow-lg">
      <span className="text-sm">
        {ids.length} selected
        <span className="opacity-60"> / {MAX_COMPARE}</span>
      </span>
      <Link
        href="/compare"
        className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-3 py-1 text-sm font-medium"
      >
        Compare →
      </Link>
      <form action={clearCompare}>
        <button
          type="submit"
          className="text-sm text-gray-300 hover:text-white"
          aria-label="Clear comparison"
        >
          ×
        </button>
      </form>
    </div>
  );
}
