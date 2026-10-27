"use client";

import {
  Award,
  Calendar,
  CheckSquare,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Pencil,
  Plus,
  Repeat,
  Shield,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { type FormEvent, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { OptionSelect } from "@/components/ui/option-select";
import { iconButton, primaryButton } from "@/features/documents/components/document-ui";
import { chip, neutralChip } from "@/features/tracking/components/dashboard-ui";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import type { ResourcePermissions } from "@/lib/auth/permissions";

import type { ResourceItem } from "../types";
import { ActiveChip, CheckField, fieldLabelClass, MessageRow, rowClass, TableCard, tableHeadClass, Toolbar } from "./rbac-ui";

const AVAILABLE_ICONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { id: "folder", label: "Proyectos", Icon: FolderKanban },
  { id: "check-square", label: "Tareas", Icon: CheckSquare },
  { id: "repeat", label: "Sprints", Icon: Repeat },
  { id: "calendar", label: "Calendario", Icon: Calendar },
  { id: "file-text", label: "Documentos", Icon: FileText },
  { id: "award", label: "Producción", Icon: Award },
  { id: "inbox", label: "Trámites", Icon: Inbox },
  { id: "user-plus", label: "Vinculaciones", Icon: UserPlus },
  { id: "users", label: "Integrantes", Icon: Users },
  { id: "shield", label: "Seguridad", Icon: Shield },
  { id: "flask", label: "Investigación", Icon: FlaskConical },
  { id: "user", label: "Perfil", Icon: UserRound },
];

const ICON_OPTIONS = AVAILABLE_ICONS.map((icon) => ({ value: icon.id, label: `${icon.label} (${icon.id})` }));

function ResourceIcon({ name }: { name: string | null }) {
  const Icon = AVAILABLE_ICONS.find((item) => item.id === (name || "").toLowerCase())?.Icon ?? LayoutDashboard;
  return <Icon aria-hidden="true" className="size-4" />;
}

type ResourcesTabProps = {
  resources: ResourceItem[];
  onRefresh: () => void;
  permissions?: ResourcePermissions;
};

export function ResourcesTab({ resources, onRefresh, permissions }: ResourcesTabProps) {
  const canCreate = permissions?.canCreate ?? true;
  const canUpdate = permissions?.canUpdate ?? true;
  const canDelete = permissions?.canDelete ?? true;
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formUrlBackend, setFormUrlBackend] = useState("");
  const [formUrlFrontend, setFormUrlFrontend] = useState("");
  const [formIcon, setFormIcon] = useState("dashboard");
  const [formOrder, setFormOrder] = useState(0);
  const [formVisibleMenu, setFormVisibleMenu] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const term = search.toLowerCase();
  const filteredResources = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(term) ||
      r.urlBackend.toLowerCase().includes(term) ||
      (r.urlFrontend && r.urlFrontend.toLowerCase().includes(term)) ||
      (r.description && r.description.toLowerCase().includes(term)),
  );

  const handleOpenCreate = () => {
    setSelectedResource(null);
    setFormName("");
    setFormDescription("");
    setFormUrlBackend("/api/v1/");
    setFormUrlFrontend("/hub/");
    setFormIcon("dashboard");
    setFormOrder((resources.length + 1) * 10);
    setFormVisibleMenu(true);
    setFormIsActive(true);
    setFormError(null);
    setModal("create");
  };

  const handleOpenEdit = (res: ResourceItem) => {
    setSelectedResource(res);
    setFormName(res.name);
    setFormDescription(res.description || "");
    setFormUrlBackend(res.urlBackend);
    setFormUrlFrontend(res.urlFrontend || "");
    setFormIcon(res.icon || "dashboard");
    setFormOrder(res.order || 0);
    setFormVisibleMenu(res.visibleMenu);
    setFormIsActive(res.isActive);
    setFormError(null);
    setModal("edit");
  };

  const payload = () =>
    JSON.stringify({
      name: formName.trim(),
      description: formDescription.trim() || null,
      urlBackend: formUrlBackend.trim(),
      urlFrontend: formUrlFrontend.trim() || null,
      icon: formIcon.trim() || null,
      order: Number(formOrder) || 0,
      visibleMenu: formVisibleMenu,
      isActive: formIsActive,
    });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const editing = modal === "edit" && selectedResource;

    if (modal === "create" && (!formName.trim() || !formUrlBackend.trim())) {
      setFormError("El nombre y la URL backend son obligatorios.");
      return;
    }
    if (modal === "edit" && !selectedResource) return;

    setSubmitting(true);
    setFormError(null);
    try {
      await apiRequest(editing ? `/resources/${selectedResource.id}` : "/resources", { method: editing ? "PATCH" : "POST", body: payload() });
      setModal(null);
      onRefresh();
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (res: ResourceItem) => {
    if (!window.confirm(`¿Estás seguro de eliminar el recurso "${res.name}"? Se eliminarán también sus permisos asociados en la matriz.`)) {
      return;
    }
    setActionError(null);
    try {
      await apiRequest(`/resources/${res.id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      setActionError(describeError(err));
    }
  };

  const creating = modal === "create";

  return (
    <>
      <Toolbar label="Buscar recursos" value={search} onChange={setSearch} placeholder="Buscar recursos por nombre o ruta…">
        {canCreate && (
          <button type="button" onClick={handleOpenCreate} aria-haspopup="dialog" className={primaryButton}>
            <Plus aria-hidden="true" className="size-4" />
            Nuevo recurso
          </button>
        )}
      </Toolbar>

      {actionError && <Alert tone="error">{actionError}</Alert>}

      <TableCard label="Recursos del sistema">
        <table className="w-full min-w-208 border-collapse text-left text-[13px]">
          <caption className="sr-only">Recursos con rutas, orden, visibilidad en el menú, estado y acciones</caption>
          <thead>
            <tr className={tableHeadClass}>
              <th scope="col" className="px-4 py-3 font-semibold">Recurso</th>
              <th scope="col" className="px-4 py-3 font-semibold">URL backend / frontend</th>
              <th scope="col" className="px-4 py-3 text-center font-semibold">Orden</th>
              <th scope="col" className="px-4 py-3 font-semibold">Menú</th>
              <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hub-border">
            {filteredResources.length > 0 ? (
              filteredResources.map((res) => (
                <tr key={res.id} className={rowClass}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
                        <ResourceIcon name={res.icon} />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-hub-text">{res.name}</p>
                        <p className="max-w-52 truncate text-xs text-hub-muted">{res.description || "Sin descripción"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <p className="text-hub-text">{res.urlBackend}</p>
                    {res.urlFrontend && <p className="text-hub-accent">{res.urlFrontend}</p>}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-hub-muted">{res.order}</td>
                  <td className="px-4 py-3">
                    {res.visibleMenu ? (
                      <span className={`${chip} gap-1 rounded-full bg-hub-info-bg px-2.5 py-1 text-hub-info-text`}>
                        <Eye aria-hidden="true" className="size-3" />
                        Visible
                      </span>
                    ) : (
                      <span className={`${neutralChip} gap-1 rounded-full px-2.5 py-1`}>
                        <EyeOff aria-hidden="true" className="size-3" />
                        Oculto
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ActiveChip active={res.isActive} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {canUpdate && (
                        <button type="button" onClick={() => handleOpenEdit(res)} aria-haspopup="dialog" className={iconButton} aria-label={`Editar el recurso ${res.name}`} title="Editar recurso">
                          <Pencil aria-hidden="true" className="size-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button type="button" onClick={() => handleDelete(res)} className={`${iconButton} hover:bg-hub-danger-bg hover:text-hub-danger-text`} aria-label={`Eliminar el recurso ${res.name}`} title="Eliminar recurso">
                          <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <MessageRow colSpan={6}>{search ? <>No se encontraron recursos con «{search}».</> : "Aún no hay recursos."}</MessageRow>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={creating ? "Crear nuevo recurso" : `Editar recurso: ${selectedResource?.name ?? ""}`}
        description={creating ? "Registra una nueva vista o endpoint protegido por RBAC." : "Modifica las propiedades de navegación y URLs del recurso."}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && <Alert tone="error">{formError}</Alert>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nombre del recurso *" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={creating ? "Ej. Reportes" : undefined} />
            <div>
              <label htmlFor="resource-icon" className={fieldLabelClass}>
                Ícono
              </label>
              <OptionSelect id="resource-icon" options={ICON_OPTIONS} value={formIcon} onValueChange={setFormIcon} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="URL backend *" required value={formUrlBackend} onChange={(e) => setFormUrlBackend(e.target.value)} placeholder={creating ? "/api/v1/reportes" : undefined} className="[&_input]:font-mono" />
            <FormField label="URL frontend" value={formUrlFrontend} onChange={(e) => setFormUrlFrontend(e.target.value)} placeholder={creating ? "/hub/reportes" : undefined} className="[&_input]:font-mono" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Descripción" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder={creating ? "Breve explicación del recurso" : undefined} />
            <FormField label="Orden de aparición" type="number" value={formOrder} onChange={(e) => setFormOrder(Number(e.target.value))} />
          </div>

          <div className="flex flex-col gap-1">
            <CheckField id="resourceVisibleMenu" label="Visible en el menú de navegación principal" checked={formVisibleMenu} onChange={setFormVisibleMenu} />
            <CheckField id="resourceIsActive" label="Recurso activo" checked={formIsActive} onChange={setFormIsActive} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" className="w-auto px-4" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="submit" pending={submitting} pendingLabel={creating ? "Creando…" : "Guardando…"}>
              {creating ? "Crear recurso" : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
