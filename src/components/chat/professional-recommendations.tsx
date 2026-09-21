'use client';

import { useEffect, useId, useRef, useState } from 'react';
import {
  type ChatProfessional,
  type ChatRecommendation,
  serviceModeLabel,
} from '@/lib/chat-recommendations';
import { professionalWhatsAppUrl } from '@/lib/professional-public-profile';

function Portrait({ professional }: { professional: ChatProfessional }) {
  const [failed, setFailed] = useState(false);
  return professional.avatarUrl && !failed ? (
    // Signed storage URLs are short-lived and must not be cached by an image proxy.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="chat-professional-photo"
      src={professional.avatarUrl}
      alt={`Foto de ${professional.name}`}
      onError={() => setFailed(true)}
    />
  ) : (
    <div
      className="chat-professional-photo chat-professional-initials"
      aria-label={`Foto não informada de ${professional.name}`}
    >
      {professional.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')}
    </div>
  );
}

function ProfileDialog({
  recommendation,
  onClose,
}: {
  recommendation: ChatRecommendation;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [professional, setProfessional] = useState<ChatProfessional | null>(
    null,
  );
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/chat?professionals=${recommendation.id}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error('Não foi possível carregar o perfil.');
        const data = await response.json();
        if (!data.professionals?.length)
          throw new Error(
            'Este perfil não está mais disponível no catálogo público.',
          );
        setProfessional(data.professionals[0]);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [recommendation.id, attempt]);

  const whatsapp = professional?.phoneNumber
    ? professionalWhatsAppUrl(professional.phoneNumber)
    : null;
  return (
    <dialog
      ref={dialogRef}
      className="chat-profile-dialog"
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="chat-profile-content">
        <button
          className="button secondary chat-profile-close"
          type="button"
          onClick={onClose}
          aria-label="Fechar perfil"
        >
          ✕
        </button>
        <h2 id={titleId}>{recommendation.name}</h2>
        {error ? (
          <div role="alert">
            <p>{error}</p>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setError('');
                setAttempt((value) => value + 1);
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : !professional ? (
          <p role="status">Carregando perfil…</p>
        ) : (
          <>
            <Portrait professional={professional} />
            <p>
              <strong>Psicólogo(a) · CRP {professional.crp}</strong>
            </p>
            <p>
              <strong>Especialidade:</strong> não informada. Consulte a
              apresentação abaixo.
            </p>
            <p>
              <strong>Modalidade:</strong>{' '}
              {serviceModeLabel(professional.serviceMode)}
            </p>
            <p>
              <strong>Localização:</strong>{' '}
              {[professional.city, professional.state]
                .filter(Boolean)
                .join('/') || 'Não informada'}
            </p>
            <h3>Apresentação profissional</h3>
            <p className="chat-profile-bio">
              {professional.bio || 'Apresentação não informada.'}
            </p>
            <h3>Relação com sua busca</h3>
            <p>{recommendation.reason}</p>
            {professional.contactEmail && (
              <p>
                <strong>E-mail:</strong>{' '}
                <a href={`mailto:${professional.contactEmail}`}>
                  {professional.contactEmail}
                </a>
              </p>
            )}
            {professional.phoneNumber && (
              <p>
                <strong>Telefone:</strong> {professional.phoneNumber}
              </p>
            )}
            {whatsapp && (
              <a
                className="button"
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                Falar pelo WhatsApp
              </a>
            )}
            <p className="muted">
              Compatibilidade baseada na apresentação pública, sem garantia de
              adequação clínica. Confirme a área de atuação e a situação atual
              do registro junto ao profissional e ao CRP.
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}

export function ProfessionalRecommendations({
  recommendations,
}: {
  recommendations: ChatRecommendation[];
}) {
  const [professionals, setProfessionals] = useState<ChatProfessional[] | null>(
    null,
  );
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<ChatRecommendation | null>(null);
  const ids = recommendations.map((item) => item.id).join(',');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/chat?professionals=${ids}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error('Não foi possível carregar os profissionais.');
        const data = await response.json();
        setProfessionals(data.professionals);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [ids, attempt]);

  return (
    <section
      className="chat-recommendations"
      aria-label="Profissionais encontrados"
    >
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setError('');
              setAttempt((value) => value + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : !professionals ? (
        <p role="status">Carregando profissionais…</p>
      ) : (
        <div className="chat-professional-grid">
          {recommendations.map((recommendation) => {
            const professional = professionals.find(
              (item) => item.id === recommendation.id,
            );
            return professional ? (
              <article key={professional.id} className="chat-professional-card">
                <Portrait professional={professional} />
                <h3>{professional.name}</h3>
                <p className="muted">
                  CRP {professional.crp} ·{' '}
                  {serviceModeLabel(professional.serviceMode)}
                </p>
                <p>
                  <strong>Especialidade:</strong> não informada
                </p>
                {professional.bio && (
                  <p className="chat-professional-summary">
                    {professional.bio}
                  </p>
                )}
                <h4>Por que pode combinar com sua busca</h4>
                <p>{recommendation.reason}</p>
                <button
                  type="button"
                  className="button secondary"
                  aria-label={`Ver mais sobre ${professional.name}`}
                  onClick={() => setSelected(recommendation)}
                >
                  Ver mais
                </button>
              </article>
            ) : (
              <article
                key={recommendation.id}
                className="chat-professional-card"
              >
                <p>
                  Um dos perfis desta busca não está mais disponível no catálogo
                  público.
                </p>
              </article>
            );
          })}
        </div>
      )}
      {selected && (
        <ProfileDialog
          recommendation={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
