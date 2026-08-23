import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  console.log('[Cloudinary] File upload service initialized')
} else {
  console.warn('[Cloudinary] File upload service not configured')
}

export class FileUploadService {
  /**
   * Upload file to Cloudinary
   */
  static async uploadFile(
    file: File | string,
    folder: string = 'kyc'
  ): Promise<{ url: string; publicId: string }> {
    try {
      // If it's a base64 string
      const result = await cloudinary.uploader.upload(file as string, {
        folder: `casino/${folder}`,
        resource_type: 'auto',
        transformation: [
          { width: 1000, crop: 'limit' }, // Max width 1000px
          { quality: 'auto' }, // Auto quality
          { fetch_format: 'auto' }, // Auto format (WebP if supported)
        ],
      })

      return {
        url: result.secure_url,
        publicId: result.public_id,
      }
    } catch (error) {
      console.error('[Cloudinary] Upload error:', error)
      throw new Error('Failed to upload file')
    }
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId)
      return true
    } catch (error) {
      console.error('[Cloudinary] Delete error:', error)
      return false
    }
  }

  /**
   * Generate signed upload URL (for direct uploads from frontend)
   */
  static generateUploadSignature(folder: string = 'kyc') {
    const timestamp = Math.round(Date.now() / 1000)
    const params = {
      timestamp,
      folder: `casino/${folder}`,
      transformation: 'w_1000,c_limit,q_auto,f_auto',
    }

    const signature = cloudinary.utils.api_sign_request(
      params,
      process.env.CLOUDINARY_API_SECRET!
    )

    return {
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder: `casino/${folder}`,
    }
  }

  /**
   * Validate file size and type
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and PDF files are allowed' }
    }

    return { valid: true }
  }
}
