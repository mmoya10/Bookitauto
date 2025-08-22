import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, createProduct, updateProduct, deleteProducts } from "../../api/products";
import Button from "../../components/common/Button";
import ToggleView from "../../components/common/ToggleView";
import { Input } from "../../components/common/Input";
import Portal from "../../components/common/Portal";
import clsx from "clsx";
import { useForm } from "react-hook-form";

const glassCard =
  "rounded-2xl border border-white/10 bg-white/10 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.25)]";

export default function ProductsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  // estado UI
  const [query, setQuery] = useState("");
  const [view, setView] = useState("cards"); // "table" | "cards"
  const [selected, setSelected] = useState([]); // ids
  const [modal, setModal] = useState({ open: false, mode: "create", product: null });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data ?? [];
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [data, query]);

  // mutaciones
  const mCreate = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setModal({ open: false, mode: "create", product: null });
    },
  });
  const mUpdate = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setModal({ open: false, mode: "create", product: null });
    },
  });
  const mDelete = useMutation({
    mutationFn: (ids) => deleteProducts(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setSelected([]);
      setConfirm(null);
    },
  });

  // seleccionar
  const allIds = filtered.map((p) => p.id);
  const allChecked = selected.length > 0 && selected.length === allIds.length;
  const toggleAll = () => setSelected(allChecked ? [] : allIds);
  const toggleOne = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // confirmación delete
  const [confirm, setConfirm] = useState(null); // { ids }

  return (
    <div className="space-y-5 text-zinc-100">
      <header>
        <h1 className="text-xl font-semibold">Productos</h1>
        <p className="text-sm text-slate-300">
          Gestiona tu catálogo: crea, edita y elimina productos.
        </p>
      </header>

      {/* Filtros/acciones */}
      <section className={clsx(glassCard, "p-4")}>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-start">
          <div className="grid gap-1.5">
            <span className="text-xs text-slate-300">Buscar</span>
            <Input
              placeholder="Nombre o descripción…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Button
            variant="ghost"
            onClick={() => setConfirm({ ids: selected })}
            disabled={!selected.length}
          >
            Eliminar seleccionados ({selected.length})
          </Button>

          <Button
            variant="primary"
            onClick={() => setModal({ open: true, mode: "create", product: null })}
          >
            + Añadir producto
          </Button>
        </div>
      </section>

      {/* Listado */}
      <section className={clsx(glassCard, "p-3")}>
        {/* toolbar interna de la sección */}
        <div className="mb-3 flex items-center justify-end">
          <ToggleView value={view} onChange={setView} />
        </div>

        {view === "table" ? (
          <TableView
            products={filtered}
            selected={selected}
            toggleAll={toggleAll}
            allChecked={allChecked}
            toggleOne={toggleOne}
            onEdit={(p) =>
              setModal({ open: true, mode: "edit", product: p })
            }
          />
        ) : (
          <CardsView
            products={filtered}
            selected={selected}
            toggleOne={toggleOne}
            onEdit={(p) =>
              setModal({ open: true, mode: "edit", product: p })
            }
          />
        )}

        {!filtered?.length && (
          <div className="px-3 py-8 text-center text-sm text-slate-400">
            No hay productos que coincidan con la búsqueda.
          </div>
        )}
      </section>

      {/* Modal crear/editar */}
      {modal.open && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,680px)] p-5")}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  {modal.mode === "edit" ? "Editar producto" : "Nuevo producto"}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setModal({ open: false, mode: "create", product: null })
                  }
                >
                  Cerrar
                </Button>
              </div>
              <ProductForm
                product={modal.product}
                submitting={mCreate.isPending || mUpdate.isPending}
                onSubmit={(payload) => {
                  if (modal.mode === "edit") {
                    mUpdate.mutate({ ...payload, id: modal.product.id });
                  } else {
                    mCreate.mutate(payload);
                  }
                }}
              />
            </div>
          </div>
        </Portal>
      )}

      {/* Confirm eliminar */}
      {confirm && (
        <Portal>
          <div className="fixed inset-0 z-[1000] grid place-items-center bg-black/40 p-4">
            <div className={clsx(glassCard, "w-[min(96vw,480px)] p-5")}>
              <h3 className="text-base font-semibold mb-2">Eliminar productos</h3>
              <p className="text-sm text-slate-300">
                Vas a eliminar <b>{confirm.ids.length}</b> producto(s). Esta
                acción no se puede deshacer.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => mDelete.mutate(confirm.ids)}
                  disabled={mDelete.isPending}
                >
                  {mDelete.isPending ? "Eliminando…" : "Eliminar"}
                </Button>
                <Button variant="ghost" onClick={() => setConfirm(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

/* =================== Vistas =================== */
function TableView({ products, selected, toggleAll, allChecked, toggleOne, onEdit }) {
  return (
    <div className="overflow-auto rounded-xl border border-white/10 bg-white/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-300">
            <th className="px-3 py-2">
              <input
                type="checkbox"
                className="size-4 rounded border-white/20 bg-white/10"
                checked={allChecked}
                onChange={toggleAll}
              />
            </th>
            <th className="px-3 py-2">Producto</th>
            <th className="px-3 py-2">Descripción</th>
            <th className="px-3 py-2">Precio</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t border-white/10">
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-white/20 bg-white/10"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleOne(p.id)}
                />
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-3">
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="h-10 w-14 object-cover rounded-lg border border-white/10"
                  />
                  <div className="font-medium">{p.name}</div>
                </div>
              </td>
              <td className="px-3 py-2 text-slate-300">{p.description}</td>
              <td className="px-3 py-2">
                <Price price={p.price} sale={p.salePrice} />
              </td>
              <td className="px-3 py-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
                  Editar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CardsView({ products, selected, toggleOne, onEdit }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="relative">
            <img
              src={p.imageUrl}
              alt=""
              className="h-36 w-full object-cover rounded-lg border border-white/10"
            />
            <label className="absolute left-2 top-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs">
              <input
                type="checkbox"
                className="size-3.5 rounded border-white/20 bg-white/10"
                checked={selected.includes(p.id)}
                onChange={() => toggleOne(p.id)}
              />
              Seleccionar
            </label>
          </div>

          <div className="mt-2 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{p.name}</div>
              <div className="text-xs text-slate-300 line-clamp-2">{p.description}</div>
            </div>
            <Price price={p.price} sale={p.salePrice} />
          </div>

          <div className="mt-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(p)}>
              Editar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =================== Formulario =================== */
function ProductForm({ product, onSubmit, submitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: product ?? {
      name: "",
      description: "",
      price: "",
      salePrice: "",
      imageUrl: "",
    },
  });

  // reset cuando llega un producto nuevo (editar)
  useEffect(() => {
    if (product) {
      reset({
        name: product.name ?? "",
        description: product.description ?? "",
        price: product.price ?? "",
        salePrice: product.salePrice ?? "",
        imageUrl: product.imageUrl ?? "",
      });
      setPreview(product.imageUrl ?? "");
      setImageMode("url");
    } else {
      reset({ name: "", description: "", price: "", salePrice: "", imageUrl: "" });
      setPreview("");
      setImageMode("url");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // modo imagen: url | file
  const [imageMode, setImageMode] = useState("url");
  const [preview, setPreview] = useState(product?.imageUrl ?? "");

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file); // demo local
    setPreview(url);
    setValue("imageUrl", url, { shouldDirty: true });
  };

  const imageUrl = watch("imageUrl");

  return (
    <form
      className="grid gap-3"
      onSubmit={handleSubmit((v) => {
        // enviar con imageUrl (si file, ya actualizamos a objectURL arriba)
        onSubmit(v);
      })}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Nombre</span>
          <Input placeholder="Nombre del producto" {...register("name", { required: true })} />
          {errors.name && <span className="text-xs text-red-300">Requerido</span>}
        </div>
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Precio (€)</span>
          <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("price", { required: true })} />
          {errors.price && <span className="text-xs text-red-300">Requerido</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Precio oferta (€)</span>
          <Input type="number" step="0.01" min="0" placeholder="(opcional)" {...register("salePrice")} />
        </div>

        <div className="grid gap-1.5">
          <span className="text-xs text-slate-300">Imagen</span>

          {/* toggle URL / Subir */}
          <div className="inline-flex gap-2">
            <button
              type="button"
              className={clsx(
                "rounded-xl border px-3 py-1.5 text-xs transition",
                imageMode === "url"
                  ? "border-transparent text-white bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] shadow-[0_8px_24px_rgba(124,58,237,0.35)]"
                  : "border-white/10 bg-white/10 text-slate-200 hover:bg-white/15"
              )}
              onClick={() => setImageMode("url")}
            >
              URL
            </button>
            <button
              type="button"
              className={clsx(
                "rounded-xl border px-3 py-1.5 text-xs transition",
                imageMode === "file"
                  ? "border-transparent text-white bg-[linear-gradient(90deg,#7c3aed,#22d3ee)] shadow-[0_8px_24px_rgba(124,58,237,0.35)]"
                  : "border-white/10 bg-white/10 text-slate-200 hover:bg-white/15"
              )}
              onClick={() => setImageMode("file")}
            >
              Subir
            </button>
          </div>

          {imageMode === "url" ? (
            <Input placeholder="https://…" {...register("imageUrl")} />
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100 file:mr-3 file:rounded-lg file:border-none file:bg-white/20 file:px-3 file:py-1.5 file:text-xs hover:bg-white/15"
              />
              {/* guardamos también el valor en imageUrl para que el submit lo envíe */}
              <input type="hidden" {...register("imageUrl")} />
            </>
          )}
        </div>
      </div>

      {/* preview */}
      {(preview || imageUrl) && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-slate-300 mb-2">Vista previa</div>
          <img
            src={imageMode === "file" ? preview : imageUrl}
            alt="preview"
            className="max-h-40 rounded-lg border border-white/10 object-contain"
          />
        </div>
      )}

      <div className="grid gap-1.5">
        <span className="text-xs text-slate-300">Descripción</span>
        <textarea
          className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-zinc-100 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-white/20 hover:bg-white/15 transition min-h-[90px]"
          placeholder="Detalles del producto…"
          {...register("description")}
        />
      </div>

      <div className="mt-1 flex items-center gap-2">
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}

/* =================== util precio =================== */
function Price({ price, sale }) {
  const fmt = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
  if (sale != null && sale !== "" && Number(sale) < Number(price)) {
    return (
      <div className="text-right">
        <div className="text-xs inline-flex items-center gap-2">
          <span className="rounded-full bg-yellow-500/20 text-yellow-100 px-2 py-0.5">
            Oferta
          </span>
        </div>
        <div className="text-sm font-semibold">{fmt.format(Number(sale))}</div>
        <div className="text-xs text-slate-300 line-through">
          {fmt.format(Number(price))}
        </div>
      </div>
    );
  }
  return <div className="text-sm font-semibold">{fmt.format(Number(price))}</div>;
}
