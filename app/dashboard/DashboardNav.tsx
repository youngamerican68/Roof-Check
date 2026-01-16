'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Overview', exact: true },
  { href: '/dashboard/leads', label: 'Leads' },
  { href: '/dashboard/campaigns', label: 'Campaigns' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
