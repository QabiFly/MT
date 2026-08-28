import crypto from 'crypto';

export interface CloudinarySignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  uploadPreset?: string;
  folder: string;
}

export function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'demo';
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '';
  const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || '';

  const isConfigured = Boolean(cloudName && apiKey && apiSecret);

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset,
    isConfigured,
  };
}

/**
 * Generate a signed upload token for direct client-to-Cloudinary upload
 */
export function generateSignedUploadParams(folder: string = 'tuition_students'): CloudinarySignatureResponse | null {
  const config = getCloudinaryConfig();
  if (!config.isConfigured) {
    return null;
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
  const signature = crypto.createHash('sha256').update(paramsToSign).digest('hex');

  return {
    signature,
    timestamp,
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    uploadPreset: config.uploadPreset,
    folder,
  };
}

/**
 * Upload image to Cloudinary via server or return optimized Base64 data URL
 */
export async function uploadImage(
  base64OrBuffer: string,
  folder: string = 'tuition_students'
): Promise<{ url: string; publicId?: string; provider: 'cloudinary' | 'local_fallback' }> {
  const config = getCloudinaryConfig();

  if (config.isConfigured) {
    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const strToSign = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
      const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

      const formData = new URLSearchParams();
      formData.append('file', base64OrBuffer);
      formData.append('api_key', config.apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);

      const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          url: data.secure_url || data.url,
          publicId: data.public_id,
          provider: 'cloudinary',
        };
      } else {
        const errorText = await response.text();
        console.warn('Cloudinary upload returned non-200, falling back to local storage:', errorText);
      }
    } catch (err) {
      console.warn('Cloudinary upload network error, using local fallback:', err);
    }
  }

  // Graceful fallback: return the clean data URI so student photos and doubt images display immediately
  return {
    url: base64OrBuffer,
    provider: 'local_fallback',
  };
}
