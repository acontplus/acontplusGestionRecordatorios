export default function StatCard({ title, count, icon, color, bg }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${bg} ${color}`}>{icon}</div>
        <span className="text-2xl font-bold text-slate-800">{count}</span>
      </div>
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
    </div>
  );
}