export default function NavItem({ icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-3 p-2 md:p-3 rounded-lg transition-colors w-full ${
        isActive ? 'md:bg-pink-50' : 'text-slate-500 hover:bg-slate-100'
      }`}
      style={isActive ? { color: '#D61672' } : {}}
    >
      <div className={`${isActive ? 'scale-110' : ''} transition-transform`}>{icon}</div>
      <span className="text-[10px] md:text-sm font-medium">{label}</span>
    </button>
  );
}