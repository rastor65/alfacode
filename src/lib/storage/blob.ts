import { del, list, put } from "@vercel/blob";

type UploadBlobInput = {
  pathname: string;
  body: File | Blob | ArrayBuffer | ReadableStream;
  access?: "public" | "private";
  contentType?: string;
};

export async function uploadBlob({
  pathname,
  body,
  access = "public",
  contentType,
}: UploadBlobInput) {
  return put(pathname, body, {
    access,
    contentType,
    addRandomSuffix: true,
  });
}

export async function listBlobs(prefix?: string) {
  return list({ prefix });
}

export async function deleteBlob(url: string) {
  return del(url);
}
