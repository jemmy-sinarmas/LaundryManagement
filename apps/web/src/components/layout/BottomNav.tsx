'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, ClipboardList, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/pos',    label: 'Kasir',   icon: ShoppingCart },
  { href: '/orders', label: 'Pesanan', icon: ClipboardList },
  { href: '/shift',  label: 'Shift',   icon: Clock },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t bg-white">
      {ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
            pathname.startsWith(href) ? 'text-blue-600' : 'text-gray-500'
          )}
        >
          <Icon size={20} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
