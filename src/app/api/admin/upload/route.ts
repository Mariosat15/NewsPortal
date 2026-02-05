import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth/admin';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { clearSettingsCache } from '@/lib/brand/server';

// POST /api/admin/upload - Upload an image file
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general'; // logo, favicon, general

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type based on upload type
    const logoAllowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const generalAllowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon'];
    
    const allowedTypes = type === 'logo' ? logoAllowedTypes : generalAllowedTypes;
    
    if (!allowedTypes.includes(file.type)) {
      const allowedMsg = type === 'logo' ? 'PNG, JPG' : 'PNG, JPG, GIF, WebP, SVG, ICO';
      return NextResponse.json(
        { success: false, error: `Invalid file type: ${file.type}. Allowed: ${allowedMsg}` },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const ext = path.extname(file.name) || getExtensionFromMime(file.type);
    const timestamp = Date.now();
    const safeName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(ext, '');
    
    let filename: string;
    if (type === 'logo') {
      // Add timestamp to logo filename for cache busting
      filename = `logo_${timestamp}${ext}`;
    } else if (type === 'favicon') {
      filename = `favicon_${timestamp}${ext}`;
    } else {
      filename = `${safeName}_${timestamp}${ext}`;
    }

    // Read file buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    // Return public URL with cache buster
    const publicUrl = `/images/uploads/${filename}`;
    
    // Clear settings cache so the new logo URL is loaded immediately
    clearSettingsCache();
    
    console.log(`[Upload] File saved: ${filePath} -> ${publicUrl}`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

function getExtensionFromMime(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/x-icon': '.ico',
  };
  return mimeToExt[mimeType] || '.png';
}
