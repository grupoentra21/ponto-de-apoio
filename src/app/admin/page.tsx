import { requireAdmin } from '@/lib/auth';
import { signOut } from '@/app/auth/actions';
import { ProfessionalActions } from '@/components/admin/professional-actions';
import { changeProfessionalStatus, deleteProfessional } from './actions';
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
      'id,registration_number,registration_region,service_mode,city,state,status,is_published,created_at,profiles!professionals_profile_id_fkey(full_name)',
    )
    .order('created_at', { ascending: false });
  const rows = (data ?? []) as unknown as Row[];
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
                  <strong>{row.profiles?.full_name ?? 'Sem nome'}</strong>
                  <br />
                  <small>
                    {row.city
                      ? `${row.city}/${row.state ?? ''}`
                      : 'Local não informado'}
                  </small>
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
                  <ProfessionalActions
                    id={row.id}
                    status={row.status}
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
