'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCustomer } from '@/hooks/useCustomers';
import MembershipBadge from '@/components/membership/MembershipBadge';
import MembershipForm from '@/components/membership/MembershipForm';
import { formatDate } from '@/lib/utils';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { customer, membership, validation, loading, error, createMembership } = useCustomer(id);
  const [showMembershipForm, setShowMembershipForm] = useState(false);

  async function handleCreateMembership(data: object) {
    await createMembership(data);
    setShowMembershipForm(false);
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Memuat...</p>;
  }

  if (error || !customer) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error ?? 'Pelanggan tidak ditemukan.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/customers" className="text-sm text-blue-600 hover:underline">
        ← Kembali ke daftar
      </Link>

      {/* Customer info card */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">{customer.nama}</h1>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">No. HP</dt>
            <dd className="font-medium text-gray-900">
              {customer.countryCode} {customer.noHp}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Kode Negara</dt>
            <dd className="font-medium text-gray-900">{customer.countryCode}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Alamat</dt>
            <dd className="font-medium text-gray-900">{customer.alamat ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Terdaftar</dt>
            <dd className="font-medium text-gray-900">{formatDate(customer.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Membership card */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Keanggotaan</h2>
          {!membership && !showMembershipForm && (
            <button
              onClick={() => setShowMembershipForm(true)}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Daftarkan
            </button>
          )}
        </div>

        {membership ? (
          <div className="space-y-3">
            <MembershipBadge membership={membership} validation={validation} />
            {membership.tipe === 'periodik' && (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Durasi</dt>
                  <dd className="font-medium">{membership.durasibulan} bulan</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Mulai</dt>
                  <dd className="font-medium">{membership.tanggalMulai}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Selesai</dt>
                  <dd className="font-medium">{membership.tanggalSelesai}</dd>
                </div>
              </dl>
            )}
            {membership.tipe === 'paket_kg' && (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Total Paket</dt>
                  <dd className="font-medium">{membership.paketKg} kg</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Sisa</dt>
                  <dd className="font-medium">{membership.sisaKg} kg</dd>
                </div>
              </dl>
            )}
          </div>
        ) : showMembershipForm ? (
          <MembershipForm
            onSubmit={handleCreateMembership}
            onCancel={() => setShowMembershipForm(false)}
          />
        ) : (
          <p className="text-sm text-gray-500">Pelanggan ini belum memiliki keanggotaan.</p>
        )}
      </div>
    </div>
  );
}
