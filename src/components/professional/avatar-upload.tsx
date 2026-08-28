'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { beginProfessionalRevision } from '@/app/area-profissional/actions';

const MAX_SOURCE_SIZE = 10 * 1024 * 1024;
const MAX_AVATAR_SIZE = 300 * 1024;
const AVATAR_SIZE = 512;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function loadImage(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('Não foi possível processar a imagem.')),
      'image/webp',
      quality,
    );
  });
}

async function prepareAvatar(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Escolha uma imagem JPEG, PNG ou WebP.');
  }
  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error('A imagem original deve ter no máximo 10 MB.');
  }

  const image = await loadImage(file);
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Seu navegador não pôde processar a imagem.');

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );

  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const blob = await canvasToBlob(canvas, quality);
    if (blob.size <= MAX_AVATAR_SIZE) return blob;
  }

  throw new Error('Não foi possível reduzir a imagem para menos de 300 KB.');
}

export function AvatarUpload({
  userId,
  initialPath,
  initialPreviewUrl,
  disabled,
  requiresReview,
}: {
  userId: string;
  initialPath: string | null;
  initialPreviewUrl: string | null;
  disabled: boolean;
  requiresReview: boolean;
}) {
  const [avatarPath, setAvatarPath] = useState(initialPath ?? '');
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl ?? '');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setIsUploading(true);
    try {
      const blob = await prepareAvatar(file);
      if (requiresReview) {
        const revision = await beginProfessionalRevision();
        if (revision.error) throw new Error(revision.error);
      }
      const path = `${userId}/avatar.webp`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('professional-avatars')
        .upload(path, blob, {
          cacheControl: '3600',
          contentType: 'image/webp',
          upsert: true,
        });
      if (uploadError) throw uploadError;

      setAvatarPath(path);
      setPreviewUrl((current) => {
        if (current.startsWith('blob:')) URL.revokeObjectURL(current);
        return URL.createObjectURL(blob);
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Não foi possível enviar a foto.',
      );
      event.target.value = '';
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="avatar-upload" aria-labelledby="avatar-title">
      <div
        className="avatar-preview"
        style={
          previewUrl ? { backgroundImage: `url("${previewUrl}")` } : undefined
        }
        role="img"
        aria-label={
          previewUrl ? 'Prévia da foto profissional' : 'Foto não adicionada'
        }
      >
        {!previewUrl && <span aria-hidden>Foto</span>}
      </div>
      <div>
        <h2 id="avatar-title">Foto profissional</h2>
        <p>
          Escolha uma foto nítida do rosto. Ela será recortada em formato
          quadrado e reduzida automaticamente para 512 × 512 pixels.
        </p>
        <label
          className={`button secondary avatar-button ${disabled ? 'disabled' : ''}`}
        >
          {isUploading
            ? 'Processando…'
            : avatarPath
              ? 'Trocar foto'
              : 'Escolher foto'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleChange}
            disabled={disabled || isUploading}
          />
        </label>
        <input type="hidden" name="avatarPath" value={avatarPath} />
        <p className="avatar-help">JPEG, PNG ou WebP, com até 10 MB.</p>
        {error && (
          <p className="form-alert error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
