import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Customer, Membership, MembershipValidationResult } from '@laundry-palu/shared';

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const fetchCustomers = useCallback(async (q: string) => {
    try {
      setLoading(true);
      setError(null);
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
      const data = await api.get<Customer[]>(`/api/v1/customers${params}`);
      setCustomers(data);
    } catch {
      setError('Gagal memuat daftar pelanggan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCustomers(query);
  }, [fetchCustomers, query]);

  async function createCustomer(data: {
    nama: string;
    noHp: string;
    alamat?: string;
  }): Promise<Customer> {
    const customer = await api.post<Customer>('/api/v1/customers', data);
    setCustomers((prev) => [customer, ...prev]);
    return customer;
  }

  return { customers, loading, error, query, setQuery, createCustomer };
}

export function useCustomer(id: string) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [validation, setValidation] = useState<MembershipValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [c, m, v] = await Promise.all([
        api.get<Customer>(`/api/v1/customers/${id}`),
        api.get<Membership | null>(`/api/v1/customers/${id}/membership`),
        api.get<MembershipValidationResult>(`/api/v1/customers/${id}/membership/validate`),
      ]);
      setCustomer(c);
      setMembership(m);
      setValidation(v);
    } catch {
      setError('Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  async function createMembership(data: object): Promise<Membership> {
    const m = await api.post<Membership>(`/api/v1/customers/${id}/membership`, data);
    setMembership(m);
    const v = await api.get<MembershipValidationResult>(
      `/api/v1/customers/${id}/membership/validate`
    );
    setValidation(v);
    return m;
  }

  return { customer, membership, validation, loading, error, createMembership, refetch: fetchAll };
}
