"use client";

import Link from "next/link";
import { signout } from "@/app/(auth)/actions";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, History, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/", label: "Event Dashboard", icon: LayoutDashboard },
  { href: "/roster", label: "Club Roster", icon: Users },
  { href: "/past-events", label: "Past Events", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLink({ href, label, icon: Icon }) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : (pathname === href || pathname.startsWith(href + "/"));
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={
        "group relative block rounded-md pl-4 pr-3 py-2 text-sm font-medium transition-colors " +
        (isActive ? "bg-white/15 text-white" : "text-white/80 hover:bg-white/10")
      }
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-[-8px] top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-white opacity-0 shadow-sm transition-all duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100"
      />
      <span className="inline-flex items-center gap-2">
        {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
        <span>{label}</span>
      </span>
    </Link>
  );
}

export default function Sidebar({ spaceName = "" }) {
  return (
    <aside className="hidden shrink-0 md:block md:w-72 bg-gradient-to-b from-[#1e5a1a] via-[var(--brand)] to-[#3a8f34] text-white">
      <div className="sticky top-0 h-screen p-5">
        <div className="mb-6">
          <div className="mt-1 text-lg font-semibold">{spaceName || "—"}</div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>


        <div className="absolute bottom-5 left-5 right-5">
          <form action={signout}>
            <button className="w-full rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer">
              <span className="inline-flex items-center gap-2">
                <LogOut className="h-4 w-4" aria-hidden />
                <span>Sign out</span>
              </span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}


