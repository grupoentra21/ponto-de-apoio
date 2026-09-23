'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { professionalProfilePath } from '@/lib/professional-public-profile';
import {
  professionalHashtags,
  normalizeHashtag,
} from '@/lib/professional-hashtags';

export type CatalogProfessional = {
  id: string;
  name: string;
  registration_number: string;
  registration_region: string;
  bio: string | null;
  service_mode: 'online' | 'in_person' | 'hybrid';
  city: string | null;
  state: string | null;
  contact_email: string | null;
  phone_number: string | null;
  avatar_url: string | null;
};

type Modality = '' | 'online' | 'presencial';

const WHATSAPP_MESSAGE =
  'Olá! Encontrei seu perfil no Ponto de Apoio e gostaria de saber mais sobre seu atendimento.';

function professionalWhatsAppUrl(phoneNumber: string | null) {
  if (!phoneNumber) return null;

  const digits = phoneNumber.replace(/\D/g, '');
  const normalizedNumber =
    digits.length === 10 || digits.length === 11
      ? `55${digits}`
      : digits.startsWith('55') &&
          (digits.length === 12 || digits.length === 13)
        ? digits
        : null;

  return normalizedNumber
    ? `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`
    : null;
}

function ProfessionalWhatsAppLink({
  phoneNumber,
}: {
  phoneNumber: string | null;
}) {
  const whatsappUrl = professionalWhatsAppUrl(phoneNumber);
  if (!whatsappUrl) return null;

  return (
    <a
      className="button secondary"
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      WhatsApp
    </a>
  );
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function uniqueOptions(values: Array<string | null>) {
  const options = new Map<string, string>();
  values.forEach((value) => {
    const trimmed = value?.trim();
    if (trimmed && !options.has(normalize(trimmed)))
      options.set(normalize(trimmed), trimmed);
  });
  return [...options.values()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function ProfessionalCatalog({
  professionals,
}: {
  professionals: CatalogProfessional[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const catalogReturnPath = searchParams.size
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const states = useMemo(
    () =>
      uniqueOptions(professionals.map((professional) => professional.state)),
    [professionals],
  );
  const initialModality = searchParams.get('modalidade');
  const [hashtag, setHashtag] = useState(
    normalizeHashtag(searchParams.get('hashtag') ?? ''),
  );
  const hashtags = useMemo(
    () =>
      uniqueOptions(
        professionals.flatMap((professional) =>
          professionalHashtags(professional.bio),
        ),
      ),
    [professionals],
  );
  const initialState = searchParams.get('estado')?.toUpperCase() ?? '';
  const [query, setQuery] = useState(searchParams.get('q')?.trim() ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [modality, setModality] = useState<Modality>(
    initialModality === 'online' || initialModality === 'presencial'
      ? initialModality
      : '',
  );
  const [state, setState] = useState(
    states.includes(initialState) ? initialState : '',
  );
  const cities = useMemo(
    () =>
      uniqueOptions(
        professionals
          .filter(
            (professional) =>
              !state ||
              normalize(professional.state ?? '') === normalize(state),
          )
          .map((professional) => professional.city),
      ),
    [professionals, state],
  );
  const initialCity = searchParams.get('cidade')?.trim() ?? '';
  const [city, setCity] = useState(
    cities.find((option) => normalize(option) === normalize(initialCity)) ?? '',
  );

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedQuery(query.trim()),
      300,
    );
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (modality) params.set('modalidade', modality);
    if (state) params.set('estado', state);
    if (city) params.set('cidade', city);
    if (hashtag) params.set('hashtag', hashtag);
    const nextUrl = params.size ? `${pathname}?${params}` : pathname;
    const currentUrl = searchParams.size
      ? `${pathname}?${searchParams.toString()}`
      : pathname;
    if (nextUrl !== currentUrl) router.replace(nextUrl, { scroll: false });
  }, [
    city,
    debouncedQuery,
    hashtag,
    modality,
    pathname,
    router,
    searchParams,
    state,
  ]);

  const filteredProfessionals = useMemo(() => {
    const normalizedQuery = normalize(query);
    return professionals.filter((professional) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          professional.name,
          professional.bio ?? '',
          professional.city ?? '',
          professional.state ?? '',
        ].some((value) => normalize(value).includes(normalizedQuery));
      const matchesModality =
        !modality ||
        (modality === 'online'
          ? ['online', 'hybrid'].includes(professional.service_mode)
          : ['in_person', 'hybrid'].includes(professional.service_mode));
      const matchesState =
        !state || normalize(professional.state ?? '') === normalize(state);
      const matchesCity =
        !city || normalize(professional.city ?? '') === normalize(city);
      const matchesHashtag =
        !hashtag ||
        professionalHashtags(professional.bio).some(
          (tag) => normalizeHashtag(tag) === hashtag,
        );
      return (
        matchesQuery &&
        matchesModality &&
        matchesState &&
        matchesCity &&
        matchesHashtag
      );
    });
  }, [city, hashtag, modality, professionals, query, state]);

  const clearFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setModality('');
    setState('');
    setCity('');
    setHashtag('');
  };

  return (
    <>
      <div className="catalog-filters" aria-label="Filtros de profissionais">
        <label className="catalog-search">
          <span>Pesquisar profissionais</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque por nome, cidade ou área de atendimento..."
          />
        </label>
        <div className="catalog-filter-grid">
          <label>
            Modalidade
            <select
              value={modality}
              onChange={(event) => setModality(event.target.value as Modality)}
            >
              <option value="">Todos</option>
              <option value="online">Online</option>
              <option value="presencial">Presencial</option>
            </select>
          </label>
          <label>
            Estado
            <select
              value={state}
              onChange={(event) => {
                setState(event.target.value);
                setCity('');
              }}
            >
              <option value="">Todos</option>
              {states.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cidade
            <select
              value={city}
              onChange={(event) => setCity(event.target.value)}
            >
              <option value="">Todas</option>
              {cities.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label hidden>
            Hashtag
            <select
              value={hashtag}
              onChange={(event) => setHashtag(event.target.value)}
            >
              <option value="">Todas</option>
              {hashtag &&
                !hashtags.some((tag) => normalizeHashtag(tag) === hashtag) && (
                  <option value={hashtag}>#{hashtag}</option>
                )}
              {hashtags.map((tag) => (
                <option
                  key={normalizeHashtag(tag)}
                  value={normalizeHashtag(tag)}
                >
                  #{tag}
                </option>
              ))}
            </select>
          </label>
          <button
            className="button secondary catalog-clear"
            type="button"
            onClick={clearFilters}
          >
            Limpar filtros
          </button>
        </div>
      </div>
      <p className="catalog-count" aria-live="polite">
        {filteredProfessionals.length}{' '}
        {filteredProfessionals.length === 1
          ? 'profissional encontrado'
          : 'profissionais encontrados'}
      </p>
      {hashtag && (
        <div className="catalog-active-tag">
          <span>
            Filtrando por <strong>#{hashtag}</strong>
          </span>
          <button
            className="professional-hashtag"
            type="button"
            onClick={() => setHashtag('')}
            aria-label="Remover filtro de hashtag"
          >
            Remover filtro ×
          </button>
        </div>
      )}
      {filteredProfessionals.length === 0 ? (
        <div className="surface empty-state catalog-no-results">
          <h2>Nenhum profissional encontrado com esses critérios.</h2>
          <button
            className="button secondary"
            type="button"
            onClick={clearFilters}
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="catalog-grid">
          {filteredProfessionals.map((professional) => (
            <article
              className="surface professional-card"
              key={professional.id}
            >
              <header className="professional-card-heading">
                <div
                  className={`avatar ${professional.avatar_url ? 'has-photo' : ''}`}
                  style={
                    professional.avatar_url
                      ? { backgroundImage: `url("${professional.avatar_url}")` }
                      : undefined
                  }
                  role={professional.avatar_url ? 'img' : undefined}
                  aria-label={
                    professional.avatar_url
                      ? `Foto de ${professional.name}`
                      : undefined
                  }
                  aria-hidden={professional.avatar_url ? undefined : true}
                >
                  {!professional.avatar_url &&
                    professional.name
                      .split(' ')
                      .slice(0, 2)
                      .map((name) => name[0])
                      .join('')}
                </div>
                <h2>
                  <Link
                    href={`${professionalProfilePath(professional.name, professional.id)}?from=${encodeURIComponent(catalogReturnPath)}`}
                  >
                    {professional.name}
                  </Link>
                </h2>
                <div className="professional-card-identity">
                  <p className="professional-card-registration">
                    Psicólogo(a) · CRP{' '}
                    {professional.registration_region.replace(/^CRP\s*/i, '')}{' '}
                    {professional.registration_number}
                  </p>
                </div>
              </header>
              <dl className="professional-card-facts">
                <div>
                  <dt>Especialidade:</dt>{' '}
                  <dd>não informada. Consulte a apresentação abaixo.</dd>
                </div>
                <div>
                  <dt>Modalidade:</dt>{' '}
                  <dd>
                    {professional.service_mode === 'online'
                      ? 'Online'
                      : professional.service_mode === 'in_person'
                        ? 'Presencial'
                        : 'Online e presencial'}
                  </dd>
                </div>
                <div>
                  <dt>Localização:</dt>{' '}
                  <dd>
                    {[professional.city, professional.state]
                      .filter(Boolean)
                      .join('/') || 'Não informada'}
                  </dd>
                </div>
              </dl>
              {professionalHashtags(professional.bio).length > 0 && (
                <div
                  className="professional-hashtags"
                  aria-label={`Hashtags de ${professional.name}`}
                >
                  {professionalHashtags(professional.bio).map((tag) => (
                    <button
                      className="professional-hashtag"
                      type="button"
                      key={normalizeHashtag(tag)}
                      aria-pressed={hashtag === normalizeHashtag(tag)}
                      onClick={() =>
                        setHashtag((current) =>
                          current === normalizeHashtag(tag)
                            ? ''
                            : normalizeHashtag(tag),
                        )
                      }
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
              <div className="professional-card-about">
                <h3>Apresentação profissional</h3>
                <p className="professional-card-bio">
                  {professional.bio ||
                    'Conheça mais sobre o atendimento no perfil profissional.'}
                </p>
              </div>
              <div className="professional-card-actions">
                <ProfessionalWhatsAppLink
                  phoneNumber={professional.phone_number}
                />
                <Link
                  className="button"
                  href={`${professionalProfilePath(professional.name, professional.id)}?from=${encodeURIComponent(catalogReturnPath)}`}
                  aria-label={`Ver perfil de ${professional.name}`}
                >
                  Ver perfil
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
