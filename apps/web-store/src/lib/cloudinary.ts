// Cloudinary direct upload utility.
// 1. Fetch a signed URL from our API (keeps API secret server-side).
// 2. POST the file directly to Cloudinary's upload endpoint.
// Returns the secure_url of the uploaded asset.

import { api } from './api.js';

interface UploadSig {
  signature:  string;
  timestamp:  number;
  folder:     string;
  cloudName:  string;
  apiKey:     string;
}

export async function uploadToCloudinary(
  file: File,
  context: 'garment' | 'store-logo' | 'rider-selfie' = 'garment',
  onProgress?: (percent: number) => void,
): Promise<string> {
  // 1. Get signed upload params from API
  const { data: sig } = await api.get(`/api/v1/media/upload-signature?context=${context}`) as { data: UploadSig };

  // 2. Build FormData
  const form = new FormData();
  form.append('file',       file);
  form.append('signature',  sig.signature);
  form.append('timestamp',  String(sig.timestamp));
  form.append('folder',     sig.folder);
  form.append('api_key',    sig.apiKey);

  // 3. Upload directly to Cloudinary via XHR (for progress events)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const result = JSON.parse(xhr.responseText) as { secure_url: string };
        resolve(result.secure_url);
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload.'));
    xhr.send(form);
  });
}
