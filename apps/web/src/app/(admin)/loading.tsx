export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 w-48 rounded bg-gray-200" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-gray-100" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-gray-100" />
    </div>
  );
}
