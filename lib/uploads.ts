import { api, type Mode, type Project } from './studio';
import { csrfHeaders, clearCsrf } from './auth';

type Upload = { id: string; chunk_size: number; storage?: string; parts?: { number: number; size: number; checksum: string }[] };

export async function uploadAsset(file: File, projectId: string, metadata: { role: string; rights: string; description: string }, onProgress: (value: number) => void) {
  const fingerprint = await checksum(new Blob([file.slice(0, 65536), file.slice(-65536)]));
  const key = `frame-asset:${projectId}:${metadata.role}:${metadata.rights}:${metadata.description}:${file.size}:${fingerprint}`;
  let init: Upload | undefined;
  const saved = sessionStorage.getItem(key);
  if (saved) {
    try { init = await api<Upload>(`/uploads/${saved}`); }
    catch { sessionStorage.removeItem(key); }
  }
  if (!init) {
    init = await api<Upload>(`/projects/${projectId}/assets/uploads`, 'POST', { ...metadata, filename: file.name, size: file.size });
    if (init.storage === 's3') sessionStorage.setItem(key, init.id);
  }
  const completed = new Map(init.parts?.map(p => [p.number, p.checksum]) || []);
  for (let offset = 0, number = 1; offset < file.size; offset += init.chunk_size, number++) {
    const chunk = file.slice(offset, offset + init.chunk_size);
    const sha = init.storage === 's3' ? await checksum(chunk) : '';
    if (completed.get(number) !== sha || init.storage !== 's3') {
      for (let attempt = 0; ; attempt++) {
        try {
          const target = init.storage === 's3'
            ? await api<{ url: string; headers: Record<string, string> }>(`/uploads/${init.id}/parts/${number}`, 'POST', { checksum: sha })
            : { url: `/api/uploads/${init.id}/chunks/${number - 1}`, headers: await csrfHeaders() };
          await put(target.url, chunk, target.headers, loaded => onProgress(Math.min(99, Math.round((offset + loaded) / file.size * 100))));
          break;
        } catch (error) { if (attempt >= 2) throw error; }
      }
    }
    onProgress(Math.min(99, Math.round((offset + chunk.size) / file.size * 100)));
  }
  const result = await api<{ job_id: string; asset_id: string }>(`/uploads/${init.id}/complete`, 'POST', {});
  sessionStorage.removeItem(key); onProgress(100);
  return result;
}

async function checksum(blob: Blob) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer()));
  return btoa(String.fromCharCode(...bytes));
}

function put(url: string, chunk: Blob, headers: Record<string, string>, progress: (n: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.timeout = 180_000;
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.upload.onprogress = (e) => progress(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        if (xhr.status === 403) clearCsrf();
        reject(new Error('This upload part could not be saved. Retry to resume your upload.'));
      }
    };
    xhr.onerror = xhr.ontimeout = () => reject(new Error('Connection interrupted. Retry to resume your upload.'));
    xhr.send(chunk);
  });
}

export async function uploadMusic(file: File, projectId: string) {
  const init = await api<Upload>(`/projects/${projectId}/music/uploads`, 'POST', { filename: file.name, size: file.size });
  for (let offset = 0, number = 1; offset < file.size; offset += init.chunk_size, number++) {
    const chunk = file.slice(offset, offset + init.chunk_size);
    const sha = await checksum(chunk);
    for (let attempt = 0; ; attempt++) {
      try {
        const target = await api<{ url: string; headers: Record<string, string> }>(`/uploads/${init.id}/parts/${number}`, 'POST', { checksum: sha });
        await put(target.url, chunk, target.headers, () => {});
        break;
      } catch (e) { if (attempt >= 2) throw e; }
    }
  }
  return api<{ asset_id: string; job_id: string }>(`/uploads/${init.id}/complete`, 'POST', {});
}

export async function uploadVideo(file: File, mode: Mode, onProgress: (value: number) => void) {
  // A small content fingerprint avoids accidentally resuming a different file.
  const fingerprint = await checksum(new Blob([file.slice(0, 65536), file.slice(-65536)]));
  const key = `frame-upload:${mode}:${file.size}:${file.lastModified}:${fingerprint}`;
  let init: Upload | undefined;
  const saved = sessionStorage.getItem(key);
  if (saved) {
    try {
      // Completion can have succeeded before navigation was interrupted.
      const completed = await api<Project>(`/projects/${saved}`);
      sessionStorage.removeItem(key);
      return completed;
    } catch { /* An unfinished upload does not have a project yet. */ }
    try { init = await api<Upload>(`/uploads/${saved}`); }
    catch { sessionStorage.removeItem(key); }
  }
  if (!init) {
    init = await api<Upload>('/uploads', 'POST', { filename: file.name, size: file.size, mode });
    if (init.storage === 's3') sessionStorage.setItem(key, init.id);
  }
  const completed = new Map(init.parts?.map((p) => [p.number, p.checksum]) || []);
  for (let offset = 0, number = 1; offset < file.size; offset += init.chunk_size, number++) {
    const chunk = file.slice(offset, offset + init.chunk_size);
    const sha = init.storage === 's3' ? await checksum(chunk) : '';
    if (!completed.has(number) || completed.get(number) !== sha) {
      for (let attempt = 0; ; attempt++) {
        try {
          const target = init.storage === 's3'
            ? await api<{ url: string; headers: Record<string, string> }>(`/uploads/${init.id}/parts/${number}`, 'POST', { checksum: sha })
            : { url: `/api/uploads/${init.id}/chunks/${number - 1}`, headers: await csrfHeaders() };
          await put(target.url, chunk, target.headers, (loaded) => onProgress(Math.min(99, Math.round((offset + loaded) / file.size * 100))));
          break;
        } catch (error) {
          if (attempt >= 2) throw error;
          await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
        }
      }
    }
    onProgress(Math.min(99, Math.round((offset + chunk.size) / file.size * 100)));
  }
  const project = await api<Project>(`/uploads/${init.id}/complete`, 'POST', {});
  sessionStorage.removeItem(key);
  onProgress(100);
  return project;
}
