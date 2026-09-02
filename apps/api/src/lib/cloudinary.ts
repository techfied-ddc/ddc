import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';
import { CLOUDINARY_FOLDERS } from '@ddc/shared';

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key:    config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure:     true,
});

export type CloudinaryFolder = keyof typeof CLOUDINARY_FOLDERS;

interface UploadOptions {
  folder: CloudinaryFolder;
  publicId?: string;
  transformation?: object;
}

export const uploadBuffer = async (
  buffer: Buffer,
  options: UploadOptions,
): Promise<{ url: string; publicId: string }> => {
  const folderPath = CLOUDINARY_FOLDERS[options.folder];

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:          folderPath,
        public_id:       options.publicId,
        transformation:  options.transformation,
        resource_type:   'auto',
        overwrite:       true,
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
};

export const deleteAsset = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const getSignedUploadUrl = (folder: CloudinaryFolder, publicId?: string) =>
  cloudinary.utils.api_sign_request(
    { folder: CLOUDINARY_FOLDERS[folder], public_id: publicId, timestamp: Math.round(Date.now() / 1000) },
    config.CLOUDINARY_API_SECRET,
  );

export { cloudinary };
