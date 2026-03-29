export default function StatCard({ title, count, icon, color, bg, isActive, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border flex flex-col justify-between transition-all cursor-pointer select-none ${
        isActive
          ? 'shadow-lg scale-105 border-transparent'
          : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:scale-105'
      }`}
      style={isActive ? { background: 'linear-gradient(135deg, #D61672, #FFA901)', color: 'white' } : {}}
    >
      <div className="flex justify-between items-start mb-3">
        {/* Icono con fondo de color */}
        <div className={`p-2.5 rounded-xl ${isActive ? 'bg-white bg-opacity-25' : bg}`}>
          <span className={isActive ? 'text-white' : color}>
            {icon}
          </span>
        </div>
        {/* Número grande */}
        <span className={`text-3xl font-bold leading-none ${isActive ? 'text-white' : 'text-slate-800'}`}>
          {count}
        </span>
      </div>
      {/* Etiqueta */}
      <h3 className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-slate-500'}`}>
        {title}
      </h3>
    </div>
  );
}