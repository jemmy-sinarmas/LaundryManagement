import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
