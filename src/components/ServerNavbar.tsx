// src/components/ServerNavbar.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import UserMenu from "./UserMenu";

export default async function ServerNavbar() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <Link href="/" className="text-xl font-semibold hover:text-yellow-400">
        AppReserve
      </Link>

      <div className="flex items-center gap-4">
        {/* primary links you already have */}
        <Link href="/reservations" className="hover:text-yellow-400">Reservations</Link>
        <Link href="/reservations/new" className="hover:text-yellow-400">New</Link>
        <Link href="/reminders" className="hover:text-yellow-400">Reminders</Link>

        {user ? (
          <UserMenu email={user.email ?? "Account"} />
        ) : (
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-yellow-400">Login</Link>
            <Link
              href="/register"
              className="bg-yellow-500 text-black px-3 py-1 rounded-md hover:bg-yellow-400 transition"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
