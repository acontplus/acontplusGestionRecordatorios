export default function StatCard({ title, count, icon, color, bg, isActive }) {
  return (
    <div
      className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
        isActive
          ? 'shadow-lg scale-105 border-transparent'
          : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:scale-102'
      }`}
      style={isActive ? {
        background: 'linear-gradient(135deg, #D61672, #FFA901)',
        color: 'white'
      } : {}}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-white bg-opacity-20' : bg} ${isActive ? '' : color}`}>
          {icon}
        </div>
        <span className={`text-2xl font-bold ${isActive ? 'text-white' : 'text-slate-800'}`}>
          {count}
        </span>
      </div>
      <h3 className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-500'}`}>
        {title}
      </h3>
    </div>
  );
}