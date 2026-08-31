'use client';

import { useEffect, useRef, useState } from 'react';
import {
  beginProfessionalRevision,
  registerVerificationDocument,
} from '@/app/area-profissional/actions';
import { createClient } from '@/lib/supabase/client';

const SELFIE_SIZE = 720;
const MAX_SELFIE_SIZE = 500 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('Não foi possível processar a selfie.')),
      'image/webp',
      quality,
    );
  });
}

export function SelfieCapture({
  userId,
  present,
  disabled,
  requiresReview,
  onComplete,
}: {
  userId: string;
  present: boolean;
  disabled: boolean;
  requiresReview: boolean;
  onComplete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  }

  function clearPreview() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return '';
    });
    setSelfieBlob(null);
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function openCamera() {
    setError('');
    clearPreview();
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          'Este dispositivo não oferece acesso à câmera. Continue em outro celular ou computador.',
        );
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch (cameraError) {
      stopCamera();
      setError(
        cameraError instanceof DOMException &&
          cameraError.name === 'NotAllowedError'
          ? 'A permissão da câmera foi negada. Autorize a câmera no navegador e tente novamente.'
          : cameraError instanceof Error
            ? cameraError.message
            : 'Não foi possível abrir a câmera.',
      );
    }
  }

  async function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError('A câmera ainda está iniciando. Tente novamente.');
      return;
    }
    const sourceSize = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement('canvas');
    canvas.width = SELFIE_SIZE;
    canvas.height = SELFIE_SIZE;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Seu navegador não conseguiu processar a selfie.');
      return;
    }
    context.drawImage(
      video,
      (video.videoWidth - sourceSize) / 2,
      (video.videoHeight - sourceSize) / 2,
      sourceSize,
      sourceSize,
      0,
      0,
      SELFIE_SIZE,
      SELFIE_SIZE,
    );
    let blob: Blob | null = null;
    for (const quality of [0.82, 0.72, 0.62, 0.52]) {
      const candidate = await canvasToBlob(canvas, quality);
      if (candidate.size <= MAX_SELFIE_SIZE) {
        blob = candidate;
        break;
      }
    }
    if (!blob) {
      setError('Não foi possível reduzir a selfie para o limite seguro.');
      stopCamera();
      return;
    }
    clearPreview();
    setSelfieBlob(blob);
    setPreviewUrl(URL.createObjectURL(blob));
    stopCamera();
  }

  async function useSelfie() {
    if (!selfieBlob) return;
    setError('');
    setIsUploading(true);
    let path = '';
    try {
      if (requiresReview) {
        const revision = await beginProfessionalRevision();
        if (revision.error) throw new Error(revision.error);
      }
      path = `${userId}/selfie/${crypto.randomUUID()}.webp`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('professional-verification')
        .upload(path, selfieBlob, {
          cacheControl: '0',
          contentType: 'image/webp',
          upsert: false,
        });
      if (uploadError) throw uploadError;
      const result = await registerVerificationDocument({
        documentType: 'selfie',
        storagePath: path,
        mimeType: 'image/webp',
      });
      if (result.error) throw new Error(result.error);
      clearPreview();
      onComplete();
    } catch (uploadError) {
      if (path)
        await createClient()
          .storage.from('professional-verification')
          .remove([path]);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Não foi possível enviar a selfie.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <article className="verification-item selfie-item">
      <div>
        <h3>Selfie de verificação</h3>
        <p>
          A selfie será usada somente pela equipe administrativa para uma
          comparação visual e manual com seu documento. Não usamos biometria,
          reconhecimento facial, OCR ou inteligência artificial.
        </p>
        <span className={`document-state ${present ? 'complete' : ''}`}>
          {present ? 'Enviada' : 'Pendente'}
        </span>
      </div>
      {cameraOpen && (
        <div className="camera-panel">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="Prévia da câmera"
          />
          <div className="camera-actions">
            <button type="button" className="button" onClick={capture}>
              Capturar selfie
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={stopCamera}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      {previewUrl && (
        <div className="camera-panel">
          {/* A URL aponta apenas para um Blob local ainda não enviado. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Prévia da selfie capturada" />
          <div className="camera-actions">
            <button
              type="button"
              className="button"
              onClick={useSelfie}
              disabled={isUploading}
            >
              {isUploading ? 'Validando…' : 'Usar esta foto'}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={openCamera}
              disabled={isUploading}
            >
              Tirar novamente
            </button>
          </div>
        </div>
      )}
      {!cameraOpen && !previewUrl && (
        <button
          type="button"
          className="button secondary"
          onClick={openCamera}
          disabled={disabled}
        >
          {present ? 'Substituir selfie' : 'Abrir câmera'}
        </button>
      )}
      {error && (
        <p className="form-alert error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
