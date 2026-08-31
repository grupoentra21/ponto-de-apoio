'use server';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import type { VerificationDocumentType } from '@/types/database';

const VERIFICATION_BUCKET = 'professional-verification';
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const MAX_SELFIE_SIZE = 500 * 1024;
const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

function value(form: FormData, key: string) {
  return String(form.get(key) ?? '').trim();
}

function matchesFileSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === 'application/pdf')
    return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  if (mimeType === 'image/jpeg')
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png')
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (byte, index) => bytes[index] === byte,
    );
  if (mimeType === 'image/webp')
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  return false;
}

function validVerificationPath(
  path: string,
  userId: string,
  documentType: VerificationDocumentType,
  mimeType: string,
) {
  const extension = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }[mimeType];
  if (!extension) return false;
  const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `^${escapedUserId}/${documentType}/[0-9a-f-]{36}\\.${extension}$`,
  ).test(path);
}

export async function beginProfessionalRevision() {
  const { supabase, user } = await requireUser();
  const { data: current, error: readError } = await supabase
    .from('professionals')
    .select('id,status')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (readError) return { error: 'Não foi possível preparar a revisão.' };
  if (!current || current.status !== 'approved') return { error: null };

  const { error } = await supabase
    .from('professionals')
    .update({
      status: 'pending_review',
      is_published: false,
      reviewed_by: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  return {
    error: error
      ? 'Não foi possível enviar o perfil novamente para verificação.'
      : null,
  };
}

export async function saveProfessional(form: FormData) {
  const { supabase, user } = await requireUser();
  const registrationNumber = value(form, 'registrationNumber');
  const region = value(form, 'registrationRegion').toUpperCase();
  const state = value(form, 'state').toUpperCase();
  const mode = value(form, 'serviceMode');
  const avatarPath = value(form, 'avatarPath');
  if (
    !registrationNumber ||
    !/^CRP\s*\d{2}$/i.test(region) ||
    !['online', 'in_person', 'hybrid'].includes(mode) ||
    (state && !/^[A-Z]{2}$/.test(state))
  )
    redirect('/area-profissional?erro=Revise o CRP, modalidade e UF.');
  const { data: current } = await supabase
    .from('professionals')
    .select('id,status')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (current && current.status === 'suspended')
    redirect(
      '/area-profissional?erro=Este perfil está bloqueado para edição. Fale com a administração.',
    );
  const nextStatus =
    current?.status === 'approved' || current?.status === 'pending_review'
      ? 'pending_review'
      : 'draft';
  const payload = {
    profile_id: user.id,
    professional_type: 'Psicólogo(a)',
    registration_number: registrationNumber,
    registration_region: region.replace(/\s+/g, ' '),
    bio: value(form, 'bio') || null,
    service_mode: mode,
    city: value(form, 'city') || null,
    state: state || null,
    contact_email: value(form, 'contactEmail') || user.email || null,
    avatar_path: avatarPath === `${user.id}/avatar.webp` ? avatarPath : null,
    status: nextStatus,
    is_published: false,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: new Date().toISOString(),
  };
  const result = current
    ? await supabase.from('professionals').update(payload).eq('id', current.id)
    : await supabase.from('professionals').insert(payload);
  if (result.error)
    redirect(
      `/area-profissional?erro=${encodeURIComponent('Não foi possível salvar: ' + result.error.message)}`,
    );
  redirect('/area-profissional?mensagem=Dados profissionais salvos.');
}

export async function registerVerificationDocument(input: {
  documentType: VerificationDocumentType;
  storagePath: string;
  mimeType: string;
}) {
  const { supabase, user } = await requireUser();
  const { documentType, storagePath, mimeType } = input;
  if (!['identity', 'crp', 'selfie'].includes(documentType))
    return { error: 'Tipo de documento inválido.' };
  if (!allowedMimeTypes.includes(mimeType as (typeof allowedMimeTypes)[number]))
    return { error: 'Formato de arquivo não permitido.' };
  if (documentType === 'selfie' && mimeType !== 'image/webp')
    return { error: 'A selfie deve ser processada em WebP.' };
  if (!validVerificationPath(storagePath, user.id, documentType, mimeType))
    return { error: 'Caminho de armazenamento inválido.' };

  const { data: professional, error: professionalError } = await supabase
    .from('professionals')
    .select('id,status')
    .eq('profile_id', user.id)
    .single();
  if (professionalError || !professional)
    return { error: 'Salve os dados profissionais antes dos documentos.' };
  if (professional.status === 'suspended')
    return { error: 'Este perfil está bloqueado para edição.' };
  if (professional.status === 'approved')
    return { error: 'Inicie uma nova revisão antes de trocar documentos.' };

  const { data: file, error: downloadError } = await supabase.storage
    .from(VERIFICATION_BUCKET)
    .download(storagePath);
  if (downloadError || !file)
    return { error: 'Não foi possível validar o arquivo enviado.' };
  const maxSize =
    documentType === 'selfie' ? MAX_SELFIE_SIZE : MAX_DOCUMENT_SIZE;
  if (file.size === 0 || file.size > maxSize) {
    await supabase.storage.from(VERIFICATION_BUCKET).remove([storagePath]);
    return { error: 'O arquivo excede o limite permitido.' };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesFileSignature(bytes, mimeType)) {
    await supabase.storage.from(VERIFICATION_BUCKET).remove([storagePath]);
    return {
      error: 'O conteúdo do arquivo não corresponde ao formato informado.',
    };
  }

  const { data: previous } = await supabase
    .from('professional_verification_documents')
    .select('storage_path')
    .eq('professional_id', professional.id)
    .eq('document_type', documentType)
    .maybeSingle();
  const now = new Date().toISOString();
  const { error: metadataError } = await supabase
    .from('professional_verification_documents')
    .upsert(
      {
        professional_id: professional.id,
        document_type: documentType,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: file.size,
        uploaded_by: user.id,
        consent_at: documentType === 'selfie' ? now : null,
        updated_at: now,
      },
      { onConflict: 'professional_id,document_type' },
    );
  if (metadataError) {
    await supabase.storage.from(VERIFICATION_BUCKET).remove([storagePath]);
    return { error: 'Não foi possível registrar o documento.' };
  }
  if (previous?.storage_path && previous.storage_path !== storagePath)
    await supabase.storage
      .from(VERIFICATION_BUCKET)
      .remove([previous.storage_path]);

  return { error: null };
}

export async function submitProfessionalVerification() {
  const { supabase, user } = await requireUser();
  const { data: professional } = await supabase
    .from('professionals')
    .select('id,status')
    .eq('profile_id', user.id)
    .maybeSingle();
  if (!professional)
    redirect('/area-profissional?erro=Salve os dados profissionais primeiro.');
  if (professional.status === 'suspended')
    redirect('/area-profissional?erro=Este perfil está bloqueado para edição.');

  const { data: documents } = await supabase
    .from('professional_verification_documents')
    .select('document_type')
    .eq('professional_id', professional.id);
  const types = new Set(
    (documents ?? []).map((document) => document.document_type),
  );
  if (!['identity', 'crp', 'selfie'].every((type) => types.has(type)))
    redirect(
      '/area-profissional?erro=Envie o documento de identidade, o comprovante do CRP e a selfie antes de continuar.',
    );

  const { error } = await supabase
    .from('professionals')
    .update({
      status: 'pending_review',
      is_published: false,
      reviewed_by: null,
      reviewed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', professional.id);
  if (error)
    redirect(
      '/area-profissional?erro=Não foi possível enviar para verificação.',
    );
  redirect('/area-profissional?mensagem=Cadastro enviado para verificação.');
}
