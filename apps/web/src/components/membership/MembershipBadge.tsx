import type { Membership, MembershipValidationResult } from '@laundry-palu/shared';
import { PAKET_KG_LOW_BALANCE_THRESHOLD } from '@laundry-palu/shared';

type Props = {
  membership: Membership | null;
  validation?: MembershipValidationResult | null;
};

export default function MembershipBadge({ membership, validation }: Props) {
  if (!membership) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        Tidak ada keanggotaan
      </span>
    );
  }

  if (membership.tipe === 'periodik') {
    const isActive = membership.isActive;
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
        }`}
      >
        Periodik {isActive ? 'Aktif' : 'Kedaluwarsa'}
        {validation?.discountPercent ? ` · ${validation.discountPercent}% diskon` : ''}
      </span>
    );
  }

  // paket_kg
  const isLow = membership.sisaKg < PAKET_KG_LOW_BALANCE_THRESHOLD;
  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          isLow ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
        }`}
      >
        Paket Kg · sisa {membership.sisaKg} kg
      </span>
      {validation?.warning && (
        <p className="text-xs text-red-600">{validation.warning}</p>
      )}
    </div>
  );
}
