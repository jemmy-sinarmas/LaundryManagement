'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <p className="mb-2 text-base font-semibold text-gray-800">Terjadi kesalahan</p>
      <p className="mb-5 text-sm text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Coba Lagi
      </button>
    </div>
  );
}
