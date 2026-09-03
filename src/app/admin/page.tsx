import { requireAdmin } from '@/lib/auth';
import { signOut } from '@/app/auth/actions';
import { ProfessionalActions } from '@/components/admin/professional-actions';
import { changeProfessionalStatus, deleteProfessional } from './actions';
import Link from 'next/link';
type Row = {
  id: string;
  registration_number: string;
  registration_region: string;
  service_mode: string;
  city: string | null;
  state: string | null;
  status: string;
  is_published: boolean;
  created_at: string;
  avatar_path: string | null;
  profiles: { full_name: string } | null;
};
const labels: Record<string, string> = {
  draft: 'Rascunho',
  pending_review: 'Aguardando',
  approved: 'Verificado',
  rejected: 'Revisão',
  suspended: 'Suspenso',
};
export default async function AdminPage() {
  const { supabase, profile } = await requireAdmin();
  const { data, error } = await supabase
    .from('professionals')
    .select(
      'id,registration_number,registration_region,service_mode,city,state,status,is_published,created_at,avatar_path,profiles!professionals_profile_id_fkey(full_name)',
    )
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
  const { data: verificationDocuments } = await supabase
    .from('professional_verification_documents')
    .select('professional_id,document_type');
  const verificationTypes = new Map<string, Set<string>>();
  verificationDocuments?.forEach((document) => {
    const types = verificationTypes.get(document.professional_id) ?? new Set();
    types.add(document.document_type);
    verificationTypes.set(document.professional_id, types);
  });
  const avatarUrls = new Map<string, string>();
  const avatarPaths = rows.flatMap((row) =>
    row.avatar_path ? [row.avatar_path] : [],
  );
  if (avatarPaths.length > 0) {
    const { data: signedAvatars } = await supabase.storage
      .from('professional-avatars')
      .createSignedUrls(avatarPaths, 3600);
    signedAvatars?.forEach((avatar) => {
      if (avatar.path && avatar.signedUrl)
        avatarUrls.set(avatar.path, avatar.signedUrl);
    });
  }
  return (
    <main className="container dashboard-page">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Administração</p>
          <h1>Profissionais cadastrados</h1>
          <p>
            Olá, {profile.full_name}. Somente perfis aprovados e publicados
            aparecem no catálogo.
          </p>
        </div>
        <form action={signOut}>
          <button className="button secondary">Sair</button>
        </form>
      </div>
      {error && (
        <p className="form-alert error">
          Não foi possível carregar os cadastros.
        </p>
      )}
      <div className="admin-summary">
        <div>
          <strong>{rows.length}</strong>
          <span>Total</span>
        </div>
        <div>
          <strong>
            {rows.filter((r) => r.status === 'pending_review').length}
          </strong>
          <span>Aguardando</span>
        </div>
        <div>
          <strong>{rows.filter((r) => r.status === 'approved').length}</strong>
          <span>Verificados</span>
        </div>
        <div>
          <strong>{rows.filter((r) => r.status === 'suspended').length}</strong>
          <span>Suspensos</span>
        </div>
      </div>
      <div className="surface table-wrap">
        <table>
          <thead>
            <tr>
              <th>Profissional</th>
              <th>CRP</th>
              <th>Atendimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="admin-professional">
                    <div
                      className={`admin-avatar ${row.avatar_path && avatarUrls.get(row.avatar_path) ? 'has-photo' : ''}`}
                      style={
                        row.avatar_path && avatarUrls.get(row.avatar_path)
                          ? {
                              backgroundImage: `url("${avatarUrls.get(row.avatar_path)}")`,
                            }
                          : undefined
                      }
                      aria-hidden
                    >
                      {(!row.avatar_path || !avatarUrls.get(row.avatar_path)) &&
                        (row.profiles?.full_name ?? 'P').slice(0, 1)}
                    </div>
                    <div>
                      <strong>{row.profiles?.full_name ?? 'Sem nome'}</strong>
                      <br />
                      <small>
                        {row.city
                          ? `${row.city}/${row.state ?? ''}`
                          : 'Local não informado'}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  {row.registration_region} {row.registration_number}
                </td>
                <td>{row.service_mode}</td>
                <td>
                  <span className={`status-badge status-${row.status}`}>
                    {labels[row.status] ?? row.status}
                  </span>
                </td>
                <td>
                  <Link
                    className="verification-link"
                    href={`/admin/profissionais/${row.id}`}
                  >
                    Ver cadastro completo
                  </Link>
                  <br />
                  <Link
                    className="verification-link"
                    href={`/admin/profissionais/${row.id}/verificacao`}
                  >
                    Ver documentos ({verificationTypes.get(row.id)?.size ?? 0}
                    /3)
                  </Link>
                  <ProfessionalActions
                    id={row.id}
                    status={row.status}
                    documentsComplete={
                      verificationTypes.get(row.id)?.size === 3
                    }
                    changeAction={changeProfessionalStatus}
                    deleteAction={deleteProfessional}
                  />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5}>Nenhum cadastro profissional encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
