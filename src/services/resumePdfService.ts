import axios from 'axios';
import { apiClient } from './apiClient';
import { authErrorMessage } from './authService';

const fallbackFilename = 'CV.pdf';

function safePdfFilename(value: string): string {
  const name = value.replace(/[\p{Cc}<>:"/\\|?*]/gu, '_').replace(/[. ]+$/, '').trim();
  const base = name.replace(/\.pdf$/i, '').slice(0, 175).replace(/[. ]+$/, '');
  return base && !/^\.+$/.test(base) ? `${base}.pdf` : fallbackFilename;
}

/** RFC 5987 names take precedence; never use a server filename as a URL/path. */
export function resumePdfFilename(disposition: unknown, title = 'CV'): string {
  if (typeof disposition === 'string') {
    const extended = /(?:^|;)\s*filename\*\s*=\s*(?:"([^"]*)"|([^;]*))/i.exec(disposition);
    const encoded = /^UTF-8'[^']*'(.*)$/i.exec((extended?.[1] ?? extended?.[2] ?? '').trim());
    if (encoded) {
      try { return safePdfFilename(decodeURIComponent(encoded[1])); } catch { /* Use the ordinary filename. */ }
    }
    const ordinary = /(?:^|;)\s*filename\s*=\s*(?:"((?:[^"\\]|\\.)*)"|([^;]*))/i.exec(disposition);
    if (ordinary) return safePdfFilename((ordinary[1] ?? ordinary[2]).replace(/\\(.)/g, '$1').trim());
  }
  return safePdfFilename(title);
}

/** The API validates ownership and reuses/regenerates its stored PDF. */
export async function getResumePdf(id: string, title = 'CV'): Promise<{ blob: Blob; filename: string }> {
  if (!id.trim()) throw new Error('Select a saved CV before downloading.');
  try {
    const response = await apiClient.get<Blob>(`/resumes/${encodeURIComponent(id)}/download`, {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
      timeout: 120_000,
    });
    const blob = response.data;
    const type = String(response.headers['content-type'] || blob?.type || '').split(';')[0].trim().toLowerCase();
    if (!(blob instanceof Blob) || !blob.size || type !== 'application/pdf') {
      throw new Error('The server did not return a PDF. Please confirm the CV and try again.');
    }
    // Backend accepts a PDF header after up to 1024 bytes of export padding.
    const header = await blob.slice(0, 1040).text();
    if (!/^(?:\uFEFF)?[ \t\r\n\f]*%PDF-\d\.\d/.test(header)) {
      throw new Error('The downloaded PDF is invalid. Please try again.');
    }
    return { blob, filename: resumePdfFilename(response.headers['content-disposition'], title) };
  } catch (error) {
    // Axios blob mode also wraps JSON ProblemDetail errors in a Blob.
    if (axios.isAxiosError(error)) {
      const payload = error.response?.data;
      if (payload instanceof Blob && payload.size <= 64 * 1024) {
        try {
          error.response!.data = JSON.parse(await payload.text());
        } catch { /* Preserve HTTP/network errors when the response is not JSON. */ }
      }
      error.message = authErrorMessage(error, 'Unable to download the CV PDF. Please try again.');
    }
    throw error;
  }
}

export async function downloadResumePdf(id: string, title = 'CV'): Promise<void> {
  const { blob, filename } = await getResumePdf(id, title);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  try {
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    // Give the browser time to begin reading the object URL before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
}
