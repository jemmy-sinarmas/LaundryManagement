import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { MessageTemplate, MessageTemplateType } from '@laundry-palu/shared';

export function useMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<MessageTemplate[]>('/api/v1/message-templates');
      setTemplates(data);
    } catch {
      setError('Gagal memuat template pesan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchTemplates(); }, [fetchTemplates]);

  async function updateTemplate(
    type: MessageTemplateType,
    updates: Partial<Pick<MessageTemplate, 'header' | 'footer' | 'isActive'>>
  ): Promise<MessageTemplate> {
    const updated = await api.patch<MessageTemplate>(
      `/api/v1/message-templates/${type}`,
      updates
    );
    setTemplates((prev) => prev.map((t) => (t.type === type ? updated : t)));
    return updated;
  }

  return { templates, loading, error, updateTemplate, refetch: fetchTemplates };
}
