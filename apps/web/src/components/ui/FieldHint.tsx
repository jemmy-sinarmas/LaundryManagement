'use client';
import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function FieldHint({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative ml-1 inline-flex align-middle">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        className="text-gray-400 hover:text-gray-600 focus:outline-none"
        aria-label="Info"
      >
        <HelpCircle size={14} />
      </button>
      {visible && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs leading-relaxed text-gray-700 shadow-lg">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
        </span>
      )}
    </span>
  );
}
