'use client';

import { ChangeEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  beginProfessionalRevision,
  registerVerificationDocument,
} from '@/app/area-profissional/actions';
import { createClient } from '@/lib/supabase/client';
import type { VerificationDocumentType } from '@/types/database';
import { SelfieCapture } from './selfie-capture';

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];
const extensions: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function DocumentUpload({
  documentType,
  title,
  description,
  userId,
  present,
  disabled,
  requiresReview,
  onComplete,
}: {
  documentType: 'identity' | 'crp';
  title: string;
  description: string;
  userId: string;
  present: boolean;
  disabled: boolean;
  requiresReview: boolean;
  onComplete: (type: VerificationDocumentType) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setIsUploading(true);
    let uploadedPath = '';
    try {
      if (!allowedTypes.includes(file.type))
        throw new Error('Escolha um arquivo PDF, JPEG, PNG ou WebP.');
      if (file.size === 0 || file.size > MAX_DOCUMENT_SIZE)
        throw new Error('O arquivo deve ter no máximo 10 MB.');
      if (requiresReview) {
        const revision = await beginProfessionalRevision();
        if (revision.error) throw new Error(revision.error);
      }
      uploadedPath = `${userId}/${documentType}/${crypto.randomUUID()}.${extensions[file.type]}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('professional-verification')
        .upload(uploadedPath, file, {
          cacheControl: '0',
          contentType: file.type,
          upsert: false,
        });
      if (uploadError) throw uploadError;
      const result = await registerVerificationDocument({
        documentType,
        storagePath: uploadedPath,
        mimeType: file.type,
      });
      if (result.error) throw new Error(result.error);
      onComplete(documentType);
    } catch (uploadError) {
      if (uploadedPath)
        await createClient()
          .storage.from('professional-verification')
          .remove([uploadedPath]);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Não foi possível enviar o documento.',
      );
      event.target.value = '';
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <article className="verification-item">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
        <span className={`document-state ${present ? 'complete' : ''}`}>
          {present ? 'Enviado' : 'Pendente'}
        </span>
      </div>
      <label
        className={`button secondary file-button ${disabled ? 'disabled' : ''}`}
      >
        {isUploading
          ? 'Validando…'
          : present
            ? 'Substituir arquivo'
            : 'Escolher arquivo'}
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          disabled={disabled || isUploading}
          onChange={handleFile}
        />
      </label>
      {error && (
        <p className="form-alert error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}

export function VerificationDocuments({
  userId,
  hasProfessional,
  initialTypes,
  disabled,
  requiresReview,
}: {
  userId: string;
  hasProfessional: boolean;
  initialTypes: VerificationDocumentType[];
  disabled: boolean;
  requiresReview: boolean;
}) {
  const router = useRouter();
  const [types, setTypes] = useState(new Set(initialTypes));
  const uploadDisabled = disabled || !hasProfessional;

  function markComplete(type: VerificationDocumentType) {
    setTypes((current) => new Set([...current, type]));
    router.refresh();
  }

  return (
    <section
      className="verification-documents"
      aria-labelledby="verification-title"
    >
      <div>
        <p className="eyebrow">Verificação privada</p>
        <h2 id="verification-title">Documentos e identidade</h2>
        <p>
          Estes arquivos são privados e acessíveis somente por você e pela
          equipe administrativa. Eles nunca aparecem no catálogo.
        </p>
        {!hasProfessional && (
          <p className="form-alert">
            Salve os dados profissionais antes de enviar os documentos.
          </p>
        )}
      </div>
      <div className="verification-list">
        <DocumentUpload
          documentType="identity"
          title="Documento de identidade"
          description="Envie RG ou CNH em PDF, JPEG, PNG ou WebP, com até 10 MB."
          userId={userId}
          present={types.has('identity')}
          disabled={uploadDisabled}
          requiresReview={requiresReview}
          onComplete={markComplete}
        />
        <DocumentUpload
          documentType="crp"
          title="Comprovante do CRP"
          description="Envie um comprovante legível do registro profissional, com até 10 MB."
          userId={userId}
          present={types.has('crp')}
          disabled={uploadDisabled}
          requiresReview={requiresReview}
          onComplete={markComplete}
        />
        <SelfieCapture
          userId={userId}
          present={types.has('selfie')}
          disabled={uploadDisabled}
          requiresReview={requiresReview}
          onComplete={() => markComplete('selfie')}
        />
      </div>
    </section>
  );
}
