import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestDetail } from "@/features/administration/components/request-detail";
import type { AttachmentList, HistoryItem, Page as ItemsPage, RequestItem } from "@/features/administration/types";
import { serverApi } from "@/lib/api/server";
import { ApiRequestError } from "@/lib/api/errors";
import { requireSessionUser } from "@/lib/auth/session";
export const metadata: Metadata = { title: "Detalle del trámite", robots: { index: false } };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params, path = `/hub/tramites/${id}`;
  await requireSessionUser(path);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const [row, history, attachments] = await Promise.all([
      serverApi<RequestItem>(`/administrative-requests/${id}`, path), serverApi<ItemsPage<HistoryItem>>(`/administrative-requests/${id}/history?pageSize=20`, path), serverApi<AttachmentList>(`/administrative-requests/${id}/documents?pageSize=20`, path),
    ]).catch(error => { if (error instanceof ApiRequestError && error.status === 404) notFound(); throw error; });
  return <div className="mx-auto w-full max-w-3xl"><Link href="/hub/tramites" className="text-sm text-hub-accent underline">Volver a trámites</Link><h1 className="mb-5 mt-3 break-words text-2xl font-bold">{row.subject}</h1><RequestDetail initial={{ row, history, attachments }} /></div>;
}
