'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { useCustomer } from '@/hooks/useCustomers';
import { useLangStore } from '@/store/langStore';
import { toast } from '@/store/toastStore';
import MembershipBadge from '@/components/membership/MembershipBadge';
import MembershipForm from '@/components/membership/MembershipForm';
import { formatDate } from '@/lib/utils';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { customer, membership, validation, loading, error, createMembership } = useCustomer(id);
  const { t } = useLangStore();
  const [showMembershipForm, setShowMembershipForm] = useState(false);

  async function handleCreateMembership(data: object) {
    await createMembership(data);
    setShowMembershipForm(false);
    toast.success(t.customers.membership_create_success);
  }

  if (loading) {
    return <p className="text-sm text-gray-400">{t.common.loading}</p>;
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
      <Breadcrumb items={[{ label: t.customers.title, href: '/customers' }, { label: customer.nama }]} />

      {/* Customer info card */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">{customer.nama}</h1>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">{t.customers.phone}</dt>
            <dd className="font-medium text-gray-900">
              {customer.countryCode} {customer.noHp}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">{t.customers.country_code}</dt>
            <dd className="font-medium text-gray-900">{customer.countryCode}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t.customers.address}</dt>
            <dd className="font-medium text-gray-900">{customer.alamat ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-gray-500">{t.customers.registered}</dt>
            <dd className="font-medium text-gray-900">{formatDate(customer.createdAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Membership card */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t.customers.membership_title}</h2>
          {!membership && !showMembershipForm && (
            <button
              onClick={() => setShowMembershipForm(true)}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              {t.customers.membership_enroll}
            </button>
          )}
        </div>

        {membership ? (
          <div className="space-y-3">
            <MembershipBadge membership={membership} validation={validation} />
            {membership.tipe === 'periodik' && (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">{t.customers.membership_duration}</dt>
                  <dd className="font-medium">{membership.durasibulan} {t.customers.duration_month}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.customers.membership_start}</dt>
                  <dd className="font-medium">{membership.tanggalMulai}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.customers.membership_end}</dt>
                  <dd className="font-medium">{membership.tanggalSelesai}</dd>
                </div>
              </dl>
            )}
            {membership.tipe === 'paket_kg' && (
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">{t.customers.membership_total}</dt>
                  <dd className="font-medium">{membership.paketKg} kg</dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t.customers.membership_remaining}</dt>
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
          <p className="text-sm text-gray-500">{t.customers.membership_none}</p>
        )}
      </div>
    </div>
  );
}
