import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  UtensilsCrossed,
  Coffee,
  Film,
  Plane,
  Footprints,
  Home,
  Gamepad2,
  Music,
  IceCream,
  Camera,
  Sparkles,
  HelpCircle,
  Pencil,
  X,
  Heart,
  Plus,
  ChevronDown,
  Activity,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  component: Index,
});

type CategoryKey = "comida" | "casa" | "actividad" | "paseo" | "otro";

const CATEGORIES: { key: CategoryKey; label: string; icon: LucideIcon }[] = [
  { key: "comida", label: "Comida", icon: UtensilsCrossed },
  { key: "casa", label: "En Casa", icon: Home },
  { key: "actividad", label: "Actividad", icon: Activity },
  { key: "paseo", label: "Paseo", icon: Footprints },
  { key: "otro", label: "Otro", icon: HelpCircle },
];

const catMap = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<
  CategoryKey,
  (typeof CATEGORIES)[number]
>;

type Plan = {
  id: string;
  category: CategoryKey;
  name: string;
  description: string;
};

const SAMPLE: Plan[] = [
  {
    id: "1",
    category: "paseo",
    name: "Picnic",
    description: "",
  },
  {
    id: "2",
    category: "comida",
    name: "Palacio Duhau",
    description: "Ir a merendar",
  },
  {
    id: "3",
    category: "comida",
    name: "Frutas de torta",
    description: "",
  },
  {
    id: "4",
    category: "casa",
    name: "Cocinar",
    description: "",
  },
  {
    id: "5",
    category: "comida",
    name: "Café Tortoni",
    description: "Churros con chocolate",
  },
  {
    id: "6",
    category: "comida",
    name: "Palacio Barolo",
    description: "Churros con chocolate",
  },
  {
    id: "7",
    category: "comida",
    name: "Famoso Paulin",
    description: "El lugar donde tiran los platos por la barra",
  },
  {
    id: "8",
    category: "comida",
    name: "Güerrin",
    description: "",
  },
];


function Index() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryKey>("comida");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [filter, setFilter] = useState<CategoryKey | "todos">("todos");

  useEffect(() => {
    fetchPlans();

    // Suscripción Realtime para actualizar al instante en mobile / desktop
    const channel = supabase
      .channel("plans-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plans" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPlans((prev) => [payload.new as Plan, ...prev.filter((p) => p.id !== payload.new.id)]);
          } else if (payload.eventType === "UPDATE") {
            setPlans((prev) => prev.map((p) => (p.id === payload.new.id ? (payload.new as Plan) : p)));
          } else if (payload.eventType === "DELETE") {
            setPlans((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchPlans() {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setPlans(data as Plan[]);
      } else {
        setPlans(SAMPLE);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setPlans(SAMPLE);
    } finally {
      setLoading(false);
    }
  }

  const filteredPlans = useMemo(() => {
    if (filter === "todos") return plans;
    return plans.filter((p) => p.category === filter);
  }, [plans, filter]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const newPlan = {
      category,
      name: name.trim(),
      description: description.trim(),
    };

    try {
      const { data, error } = await supabase
        .from("plans")
        .insert([newPlan])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPlans((p) => [data as Plan, ...p.filter((x) => x.id !== data.id)]);
      }
    } catch (err) {
      console.error("Error adding plan to Supabase:", err);
      const fallback: Plan = {
        id: crypto.randomUUID(),
        ...newPlan,
      };
      setPlans((p) => [fallback, ...p]);
    }

    setName("");
    setDescription("");
    setCategory("comida");
  }

  async function handleDelete(id: string) {
    setRemovingId(id);
    try {
      await supabase.from("plans").delete().eq("id", id);
    } catch (err) {
      console.error("Error deleting plan:", err);
    }
    setTimeout(() => {
      setPlans((p) => p.filter((x) => x.id !== id));
      setRemovingId(null);
    }, 240);
  }

  async function handleSaveEdit(updated: Plan) {
    try {
      await supabase
        .from("plans")
        .update({
          name: updated.name,
          description: updated.description,
          category: updated.category,
        })
        .eq("id", updated.id);
    } catch (err) {
      console.error("Error updating plan:", err);
    }
    setPlans((p) => p.map((x) => (x.id === updated.id ? updated : x)));
    setEditing(null);
  }

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-rose-100 selection:text-rose-900">
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-8 sm:pt-12">
        {/* Header */}
        <header className="mb-6 text-center sm:mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 backdrop-blur px-3.5 py-1 text-xs text-muted-foreground shadow-sm">
            <Heart className="h-3.5 w-3.5 fill-[var(--blush)] text-[var(--blush)]" strokeWidth={1.5} />
            <span className="font-medium tracking-wide">el diario de ivan y la gordita</span>
          </div>
        </header>

        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-[38fr_62fr] lg:gap-8">
          {/* Left: form */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <form
              onSubmit={handleAdd}
              className="rounded-2xl sm:rounded-3xl border border-border/60 bg-card p-4 sm:p-6 shadow-soft"
            >
              <div className="mb-4 sm:mb-5">
                <h2 className="font-display text-lg sm:text-xl text-foreground">Nuevo plan</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  Algo lindo para hacer juntos.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-medium text-muted-foreground">
                    Tipo de actividad
                  </Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as CategoryKey)}>
                    <SelectTrigger
                      id="category"
                      className="h-10 sm:h-11 rounded-xl border-border/70 bg-background text-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CATEGORIES.map((c) => {
                        const Icon = c.icon;
                        return (
                          <SelectItem key={c.key} value={c.key} className="rounded-lg">
                            <span className="flex items-center gap-2.5">
                              <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                              {c.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ver el atardecer"
                    className="h-10 sm:h-11 rounded-xl border-border/70 bg-background text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="description"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Breve descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Llevar unos mates y mirar el río."
                    rows={2}
                    className="resize-none rounded-xl border-border/70 bg-background text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  className="group h-10 sm:h-11 w-full rounded-xl bg-foreground text-background shadow-soft transition-all duration-300 hover:bg-foreground/90 hover:shadow-lift active:scale-[0.98] text-sm font-medium"
                >
                  <Plus className="mr-1.5 h-4 w-4 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2} />
                  Agregar plan
                </Button>
              </div>
            </form>
          </aside>

          {/* Right: list */}
          <section className="min-w-0">
            <CategoryFilter filter={filter} onChange={setFilter} />
            {filteredPlans.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {filteredPlans.map((plan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    removing={removingId === plan.id}
                    onEdit={() => setEditing(plan)}
                    onDelete={() => handleDelete(plan.id)}
                  />
                ))}
              </div>
            )}
          </section>

        </div>

        {/* Footer */}
        <footer className="mt-16 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            Hecho con mucho
            <Heart className="h-3 w-3 fill-[var(--blush)] text-[var(--blush)]" strokeWidth={1.5} />
            amor.
          </p>
        </footer>
      </div>

      <EditDialog
        plan={editing}
        onClose={() => setEditing(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}

function PlanCard({
  plan,
  removing,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  removing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const cat = catMap[plan.category];
  const Icon = cat.icon;

  return (
    <article
      className={`group rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 shadow-soft transition-all duration-300 hover:shadow-lift ${
        removing ? "animate-plan-out" : "animate-plan-in"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--blush-soft)] text-foreground/80">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>

        <div
          className="min-w-0 flex-1 cursor-pointer select-none py-0.5"
          onClick={() => plan.description && setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-base leading-snug text-foreground sm:text-base">
              {plan.name}
            </h3>
            <span className="shrink-0 rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {cat.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {plan.description && (
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Ocultar descripción" : "Ver descripción"}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                strokeWidth={2}
              />
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Eliminar"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {plan.description && isOpen && (
        <div className="mt-3 border-t border-border/40 pt-2.5 pl-12 pr-2 animate-in fade-in-50 slide-in-from-top-1 duration-200">
          <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>
        </div>
      )}
    </article>
  );
}


function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-card/40 px-8 py-20 text-center">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        className="mb-6"
        aria-hidden
      >
        <circle cx="60" cy="60" r="52" stroke="var(--border)" strokeWidth="1.2" />
        <circle cx="60" cy="60" r="30" fill="var(--blush-soft)" />
        <path
          d="M60 74c-6-4-14-9-14-17a8 8 0 0114-5 8 8 0 0114 5c0 8-8 13-14 17z"
          fill="var(--blush)"
        />
      </svg>
      <h3 className="font-display text-xl text-foreground">
        Aún no tenemos planes guardados.
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Empecemos a llenar nuestra historia.
      </p>
    </div>
  );
}

function CategoryFilter({
  filter,
  onChange,
}: {
  filter: CategoryKey | "todos";
  onChange: (f: CategoryKey | "todos") => void;
}) {
  return (
    <div className="mb-4 sm:mb-5 flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 sm:flex-wrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onChange("todos")}
        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
          filter === "todos"
            ? "bg-foreground text-background"
            : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
        }`}
      >
        Todos
      </button>
      {CATEGORIES.map((c) => {
        const Icon = c.icon;
        const active = filter === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => onChange(c.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-foreground text-background"
                : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-3 w-3" strokeWidth={1.75} />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function EditDialog({

  plan,
  onClose,
  onSave,
}: {
  plan: Plan | null;
  onClose: () => void;
  onSave: (p: Plan) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryKey>("paseo");

  const open = plan !== null;

  useMemo(() => {
    if (plan) {
      setName(plan.name);
      setDescription(plan.description);
      setCategory(plan.category);
    }
  }, [plan]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-3xl border-border/60 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-medium">
            Editar plan
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Tipo</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CategoryKey)}>
              <SelectTrigger className="h-11 rounded-xl border-border/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <SelectItem key={c.key} value={c.key} className="rounded-lg">
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                        {c.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Nombre</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl border-border/70"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Descripción</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none rounded-xl border-border/70"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            onClick={() =>
              plan && onSave({ ...plan, name: name.trim() || plan.name, description, category })
            }
            className="rounded-xl bg-foreground text-background hover:bg-foreground/90"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
