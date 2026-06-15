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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',   label: 'Dasbor',      icon: LayoutDashboard },
  { href: '/customers',   label: 'Pelanggan',    icon: Users },
  { href: '/orders',      label: 'Pesanan',      icon: ClipboardList },
  { href: '/items',       label: 'Layanan',      icon: Package },
  { href: '/promotions',  label: 'Promosi',      icon: Tag },
  { href: '/expenses',    label: 'Pengeluaran',  icon: DollarSign },
  { href: '/inventory',   label: 'Inventori',    icon: Boxes },
  { href: '/reports',     label: 'Laporan',      icon: BarChart3 },
  { href: '/branches',    label: 'Cabang',       icon: GitBranch },
  { href: '/users',       label: 'Pengguna',     icon: UserCog },
  { href: '/message-templates', label: 'Template WA', icon: MessageCircle },
  { href: '/settings',    label: 'Pengaturan',   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-60 flex-col border-r bg-white">
      <div className="border-b p-4">
        <span className="font-bold text-blue-600">Laundry Palu</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
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
      </nav>
    </aside>
  );
}
