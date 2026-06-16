'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  DollarSign,
  Boxes,
  BarChart3,
  UserCog,
  Settings,
  GitBranch,
  ClipboardList,
  Tag,
  MessageCircle,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLangStore } from '@/store/langStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLangStore();

  const NAV_GROUPS = [
    {
      label: t.nav.group_operational,
      items: [
        { href: '/dashboard',  label: t.nav.dashboard,  icon: LayoutDashboard },
        { href: '/customers',  label: t.nav.customers,  icon: Users },
        { href: '/orders',     label: t.nav.orders,     icon: ClipboardList },
      ],
    },
    {
      label: t.nav.group_config,
      items: [
        { href: '/items',      label: t.nav.items,      icon: Package },
        { href: '/promotions', label: t.nav.promotions, icon: Tag },
        { href: '/expenses',   label: t.nav.expenses,   icon: DollarSign },
        { href: '/inventory',  label: t.nav.inventory,  icon: Boxes },
      ],
    },
    {
      label: t.nav.group_admin,
      items: [
        { href: '/reports',           label: t.nav.reports,           icon: BarChart3 },
        { href: '/branches',          label: t.nav.branches,          icon: GitBranch },
        { href: '/users',             label: t.nav.users,             icon: UserCog },
        { href: '/message-templates', label: t.nav.message_templates, icon: MessageCircle },
        { href: '/notifications',     label: t.nav.notifications,     icon: Bell },
        { href: '/settings',          label: t.nav.settings,          icon: Settings },
      ],
    },
  ];

  return (
    <aside className="flex w-60 flex-col border-r bg-white">
      <div className="border-b p-4">
        <span className="font-bold text-blue-600">{t.app.name}</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-1 border-t border-gray-100 pt-1' : ''}>
            <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {group.label}
            </p>
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50',
                  pathname.startsWith(href) && 'bg-blue-50 font-medium text-blue-600'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
