// Media: signed Cloudinary upload endpoint.
// The client fetches a signed URL from here, then uploads directly to Cloudinary.
// This keeps the API from handling large binary payloads.

import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../../lib/config.js';

type UploadContext = 'garment' | 'store-logo' | 'rider-selfie' | 'general';

const FOLDER_MAP: Record<UploadContext, string> = {
  'garment':     'ddc/garments',
  'store-logo':  'ddc/logos',
  'rider-selfie':'ddc/riders',
  'general':     'ddc/general',
};

// Max file size per context (bytes)
const SIZE_MAP: Record<UploadContext, number> = {
  'garment':     8_000_000,   // 8 MB
  'store-logo':  2_000_000,   // 2 MB
  'rider-selfie':4_000_000,   // 4 MB
  'general':     8_000_000,
};

export const getUploadSignature = (req: Request, res: Response, next: NextFunction) => {
  try {
    const ctx = (req.query['context'] as UploadContext) ?? 'general';
    if (!FOLDER_MAP[ctx]) {
      return res.status(400).json({ ok: false, error: { code: 'INVALID_CONTEXT', message: `Unknown context: ${ctx}` } });
    }

    const folder    = FOLDER_MAP[ctx];
    const timestamp = Math.floor(Date.now() / 1000);
    const maxBytes  = SIZE_MAP[ctx];

    // Parameters to sign (must match what the client sends in the upload request)
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };

    // Build the string-to-sign (sorted keys, joined with &)
    const stringToSign = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join('&');

    const signature = crypto
      .createHash('sha256')
      .update(stringToSign + config.CLOUDINARY_API_SECRET)
      .digest('hex');

    res.json({
      ok:   true,
      data: {
        signature,
        timestamp,
        folder,
        cloudName: config.CLOUDINARY_CLOUD_NAME,
        apiKey:    config.CLOUDINARY_API_KEY,
        maxBytes,
        uploadPreset: undefined, // using signed upload, no preset needed
      },
    });
  } catch (err) { next(err); }
};
