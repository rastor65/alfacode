"use client";

import {
  Award,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Edit2,
  Eye,
  EyeOff,
  FileText,
  FlaskConical,
  FolderKanban,
  Inbox,
  LayoutDashboard,
  Plus,
  Repeat,
  Shield,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { apiRequest } from "@/lib/api/client";
import { describeError } from "@/lib/api/errors";
import type { ResourcePermissions } from "@/lib/auth/permissions";

import type { ResourceItem } from "../types";

const AVAILABLE_ICONS = [
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

function renderIconPreview(iconName: string | null) {
  const match = AVAILABLE_ICONS.find((i) => i.id === (iconName || "").toLowerCase());
  if (!match) return <LayoutDashboard size={14} />;
  const Comp = match.Icon;
  return <Comp size={14} />;
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
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);

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

  const filteredResources = resources.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.urlBackend.toLowerCase().includes(search.toLowerCase()) ||
      (r.urlFrontend && r.urlFrontend.toLowerCase().includes(search.toLowerCase())) ||
      (r.description && r.description.toLowerCase().includes(search.toLowerCase())),
  );

  const handleOpenCreate = () => {
    setFormName("");
    setFormDescription("");
    setFormUrlBackend("/api/v1/");
    setFormUrlFrontend("/hub/");
    setFormIcon("dashboard");
    setFormOrder((resources.length + 1) * 10);
    setFormVisibleMenu(true);
    setFormIsActive(true);
    setFormError(null);
    setCreateModalOpen(true);
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
    setEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrlBackend.trim()) {
      setFormError("El nombre y la URL backend son obligatorios.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiRequest("/resources", {
        method: "POST",
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          urlBackend: formUrlBackend.trim(),
          urlFrontend: formUrlFrontend.trim() || null,
          icon: formIcon.trim() || null,
          order: Number(formOrder) || 0,
          visibleMenu: formVisibleMenu,
          isActive: formIsActive,
        }),
      });
      setCreateModalOpen(false);
      onRefresh();
    } catch (err) {
      setFormError(describeError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await apiRequest(`/resources/${selectedResource.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          urlBackend: formUrlBackend.trim(),
          urlFrontend: formUrlFrontend.trim() || null,
          icon: formIcon.trim() || null,
          order: Number(formOrder) || 0,
          visibleMenu: formVisibleMenu,
          isActive: formIsActive,
        }),
      });
      setEditModalOpen(false);
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
    try {
      await apiRequest(`/resources/${res.id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      alert(describeError(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Búsqueda y Botón Nuevo Recurso */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar recursos por nombre o ruta..."
            className="w-full rounded-xl border border-hub-border bg-hub-bg/60 px-3 py-2 text-xs text-hub-text placeholder:text-hub-muted focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        {canCreate && (
          <Button onClick={handleOpenCreate} className="gap-2">
            <Plus size={16} />
            Nuevo Recurso
          </Button>
        )}
      </div>

      {/* Tabla de Recursos */}
      <div className="overflow-hidden rounded-2xl border border-hub-border bg-hub-panel shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-hub-border bg-hub-hover/40 text-[11px] font-semibold uppercase tracking-wider text-hub-muted">
              <tr>
                <th className="px-4 py-3">Recurso</th>
                <th className="px-4 py-3">URL Backend / Frontend</th>
                <th className="px-4 py-3 text-center">Orden</th>
                <th className="px-4 py-3">Menú</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hub-border/60">
              {filteredResources.length > 0 ? (
                filteredResources.map((res) => (
                  <tr key={res.id} className="transition hover:bg-hub-hover/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-hub-accent-soft text-hub-accent">
                          {renderIconPreview(res.icon)}
                        </div>
                        <div>
                          <p className="font-semibold text-hub-text">{res.name}</p>
                          <p className="text-[11px] text-hub-muted truncate max-w-[200px]">
                            {res.description || "Sin descripción"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <p className="text-hub-text">{res.urlBackend}</p>
                      {res.urlFrontend && (
                        <p className="text-hub-accent text-[10px]">{res.urlFrontend}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-hub-muted">{res.order}</td>
                    <td className="px-4 py-3">
                      {res.visibleMenu ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-500">
                          <Eye size={12} /> Visible
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-hub-muted/10 px-2 py-0.5 text-[10px] font-medium text-hub-muted">
                          <EyeOff size={12} /> Oculto
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {res.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
                          <CheckCircle2 size={12} /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-500">
                          <XCircle size={12} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEdit(res)}
                            title="Editar recurso"
                            className="h-8 w-8 p-0 text-hub-muted hover:text-hub-text"
                          >
                            <Edit2 size={14} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            onClick={() => handleDelete(res)}
                            title="Eliminar recurso"
                            className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-hub-muted">
                    No se encontraron recursos con &ldquo;{search}&rdquo;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Recurso */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Crear Nuevo Recurso"
        description="Registra una nueva vista o endpoint protegido por RBAC."
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
          {formError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">Nombre del Recurso *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej. Reportes"
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">Ícono</label>
              <select
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {AVAILABLE_ICONS.map((ic) => (
                  <option key={ic.id} value={ic.id}>
                    {ic.label} ({ic.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">URL Backend *</label>
              <input
                type="text"
                required
                value={formUrlBackend}
                onChange={(e) => setFormUrlBackend(e.target.value)}
                placeholder="/api/v1/reportes"
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 font-mono text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">URL Frontend</label>
              <input
                type="text"
                value={formUrlFrontend}
                onChange={(e) => setFormUrlFrontend(e.target.value)}
                placeholder="/hub/reportes"
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 font-mono text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">Descripción</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Breve explicación del recurso"
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">Orden de aparición</label>
              <input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value))}
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="createVisibleMenu"
                checked={formVisibleMenu}
                onChange={(e) => setFormVisibleMenu(e.target.checked)}
                className="size-4 rounded border-hub-border text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="createVisibleMenu" className="text-xs text-hub-text select-none cursor-pointer">
                Visible en el menú de navegación principal
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="createIsActiveRes"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="size-4 rounded border-hub-border text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="createIsActiveRes" className="text-xs text-hub-text select-none cursor-pointer">
                Recurso activo
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creando..." : "Crear Recurso"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Recurso */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Editar Recurso: ${selectedResource?.name}`}
        description="Modifica las propiedades de navegación y URLs del recurso."
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
          {formError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">Nombre del Recurso *</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">Ícono</label>
              <select
                value={formIcon}
                onChange={(e) => setFormIcon(e.target.value)}
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                {AVAILABLE_ICONS.map((ic) => (
                  <option key={ic.id} value={ic.id}>
                    {ic.label} ({ic.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">URL Backend *</label>
              <input
                type="text"
                required
                value={formUrlBackend}
                onChange={(e) => setFormUrlBackend(e.target.value)}
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 font-mono text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">URL Frontend</label>
              <input
                type="text"
                value={formUrlFrontend}
                onChange={(e) => setFormUrlFrontend(e.target.value)}
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 font-mono text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">Descripción</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-hub-text mb-1">Orden de aparición</label>
              <input
                type="number"
                value={formOrder}
                onChange={(e) => setFormOrder(Number(e.target.value))}
                className="w-full rounded-xl border border-hub-border bg-hub-bg px-3 py-2 text-xs text-hub-text focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editVisibleMenu"
                checked={formVisibleMenu}
                onChange={(e) => setFormVisibleMenu(e.target.checked)}
                className="size-4 rounded border-hub-border text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="editVisibleMenu" className="text-xs text-hub-text select-none cursor-pointer">
                Visible en el menú de navegación principal
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsActiveRes"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="size-4 rounded border-hub-border text-cyan-600 focus:ring-cyan-500"
              />
              <label htmlFor="editIsActiveRes" className="text-xs text-hub-text select-none cursor-pointer">
                Recurso activo
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
