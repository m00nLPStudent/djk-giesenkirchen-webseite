export default function AdminToolbar({
  items = [],
  activeId,
  onChange,
  outerClassName = "",
  innerClassName = "",
  itemClassName = "",
  activeClassName = "bg-red-600 text-white",
  inactiveClassName = "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white",
}) {
  return (
    <div className={outerClassName}>
      <div className={innerClassName}>
        {items.map((item) => {
          const active = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`${itemClassName} ${active ? activeClassName : inactiveClassName}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
