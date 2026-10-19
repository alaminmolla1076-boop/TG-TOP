import { admin } from './entities.ts';
import { PUBLIC_BUCKET } from './tables.ts';
// Drop-in replacements for the Base44 Core storage integrations, so every
// ported function keeps calling `base44.integrations.Core.UploadFile(...)`.
function randomName(fallbackExt = 'bin') {
  return `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${fallbackExt}`;
}
export async function UploadFile({ file }) {
  const name = file.name || randomName();
  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID().slice(0, 8)}_${name}`;
  const { error } = await admin.storage.from(PUBLIC_BUCKET).upload(path, file, {
    contentType: file.type || 'application/octet-stream',
    upsert: false
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return {
    file_url: data.publicUrl
  };
}
export async function UploadPrivateFile({ file }) {
  const { file_url } = await UploadFile({
    file
  });
  return {
    file_uri: file_url
  };
}
export async function CreateFileSignedUrl({ file_uri }) {
  // The bucket is public, so the stored URL is already directly downloadable.
  return {
    signed_url: file_uri
  };
}
