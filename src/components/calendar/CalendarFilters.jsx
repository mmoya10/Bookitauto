import clsx from "clsx";
import MultiSelect from "../common/MultiSelect";
import Button from "../common/Button";
import { Funnel } from "lucide-react";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

function FilterGroup({ title, children }) {
  return (
    <div className="p-3 border rounded-xl border-white/10 bg-white/5">
      <div className="mb-2 text-xs font-medium text-slate-300">{title}</div>
      {children}
    </div>
  );
}

export default function CalendarFilters({
  calendars = [],
  categories = [],
  staff = [],
  // estado de selección
  selectedCalendars = [],
  setSelectedCalendars,
  selectedCategories = [],
  setSelectedCategories,
  selectedStaff = [],
  setSelectedStaff,
  estado = [],
  setEstado,
  // abrir/cerrar en móvil
  filtersOpen,
  setFiltersOpen,
  // limpiar
  onClear,
  // opcional estilado extra
  className = "",
}) {
  const disabledClear = !calendars?.length || !categories?.length || !staff?.length;

  return (
    <section
      className={clsx(
        glassCard,
        "p-4 relative",
        filtersOpen ? "z-10" : "z-0",
        className
      )}
    >
      {/* Toggle móvil */}
      <div className="mb-3 md:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl border-white/10 bg-white/10 text-zinc-100 hover:bg-white/15"
          title="Mostrar/ocultar filtros"
        >
          <Funnel size={16} className="opacity-80" />
          Filtros
        </button>
      </div>

      {/* Contenido */}
      <div className={clsx(filtersOpen ? "block" : "hidden", "md:block")}>
        <div className="grid gap-3 md:grid-cols-5">
          {/* Calendarios */}
          <FilterGroup title="Calendarios">
            <MultiSelect
              items={(calendars ?? []).map((c) => ({ id: c.id, label: c.name }))}
              values={selectedCalendars}
              onChange={setSelectedCalendars}
              placeholder="Todos los calendarios"
              selectAllLabel="Todos"
              showSelectAll
            />
          </FilterGroup>

          {/* Categorías */}
          <FilterGroup title="Categorías">
            <MultiSelect
              items={(categories ?? []).map((c) => ({ id: c.id, label: c.name }))}
              values={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Todas las categorías"
              selectAllLabel="Todas"
              showSelectAll
            />
          </FilterGroup>

          {/* Personal */}
          <FilterGroup title="Personal">
            <MultiSelect
              items={(staff ?? []).map((s) => ({ id: s.id, label: s.name }))}
              values={selectedStaff}
              onChange={setSelectedStaff}
              placeholder="Todo el personal"
              selectAllLabel="Todo"
              showSelectAll
            />
          </FilterGroup>

          {/* Estado */}
          <FilterGroup title="Estado">
            <MultiSelect
              items={[
                { id: "asistida", label: "Asistidas" },
                { id: "no_asistida", label: "No asistidas" },
                { id: "pendiente", label: "Pendientes" },
              ]}
              values={estado}
              onChange={setEstado}
              placeholder="Todos los estados"
              selectAllLabel="Todos"
              showSelectAll
            />
          </FilterGroup>

          <Button
            variant="ghost"
            onClick={onClear}
            title="Restablecer filtros"
            disabled={disabledClear}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>
    </section>
  );
}
