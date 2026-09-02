import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { getUploadSignature } from './media.controller.js';

export const mediaRouter = Router();

// GET /media/upload-signature?context=garment|store-logo|rider-selfie|general
// Returns a signed Cloudinary upload signature for client-side direct upload.
// Any authenticated user can request a signature; context controls folder + size limit.
mediaRouter.get('/upload-signature', authenticate, getUploadSignature);
