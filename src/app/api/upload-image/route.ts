import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    if (!type || !['logo', 'hero'].includes(type)) {
      return NextResponse.json(
        { error: 'Tipo de imagen inválido' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: `El archivo debe ser una imagen. Tipo recibido: ${file.type}` },
        { status: 400 }
      );
    }

    // Validar tamaño
    const maxSize = type === 'hero' ? 10 : 5;
    if (file.size > maxSize * 1024 * 1024) {
      return NextResponse.json(
        { error: `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo permitido: ${maxSize}MB` },
        { status: 400 }
      );
    }

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${type}-${timestamp}.${fileExtension}`;
    const imagePath = `/images/${fileName}`;

    // Convertir archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear la carpeta si no existe
    const publicImagesDir = join(process.cwd(), 'public', 'images');
    await mkdir(publicImagesDir, { recursive: true });

    // Guardar archivo físicamente
    const filePath = join(publicImagesDir, fileName);
    await writeFile(filePath, buffer);

    console.log('✅ Imagen guardada localmente:', {
      fileName,
      filePath,
      imagePath,
      size: file.size,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      imagePath,
      fileName 
    });

  } catch (error) {
    console.error('❌ Error al subir imagen:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 