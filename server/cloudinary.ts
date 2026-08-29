import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  bytes?: number;
  format?: string;
}

export function getCloudinaryConfig() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
  let apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

  // Parse CLOUDINARY_URL if provided
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (cloudinaryUrl && cloudinaryUrl.startsWith('cloudinary://')) {
    try {
      const parsed = new URL(cloudinaryUrl);
      cloudName = parsed.hostname || cloudName;
      apiKey = parsed.username || apiKey;
      apiSecret = parsed.password || apiSecret;
    } catch (e) {
      console.warn('Failed to parse CLOUDINARY_URL:', e);
    }
  }

  const isConfigured = Boolean(cloudName && apiKey && apiSecret && cloudName !== 'demo');

  if (isConfigured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset,
    isConfigured,
  };
}

/**
 * Upload an image (base64 string or data uri) directly to Cloudinary.
 * Throws explicit error if Cloudinary environment variables are missing.
 */
export async function uploadToCloudinary(
  fileBase64OrUrl: string,
  folder: string = 'manasthali_tuition'
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();

  if (!config.isConfigured) {
    throw new Error(
      'Cloudinary environment variables missing: Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in settings.'
    );
  }

  try {
    const uploadResponse = await cloudinary.uploader.upload(fileBase64OrUrl, {
      folder,
      resource_type: 'auto',
      transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
    });

    return {
      url: uploadResponse.secure_url || uploadResponse.url,
      publicId: uploadResponse.public_id,
      bytes: uploadResponse.bytes,
      format: uploadResponse.format,
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message || error}`);
  }
}
