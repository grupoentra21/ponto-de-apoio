'use client';
type Action = (form: FormData) => Promise<void>;
export function ProfessionalActions({
  id,
  status,
  changeAction,
  deleteAction,
}: {
  id: string;
  status: string;
  changeAction: Action;
  deleteAction: Action;
}) {
  return (
    <div className="admin-actions">
      {status !== 'approved' && status !== 'suspended' && (
        <form action={changeAction}>
          <input type="hidden" name="id" value={id} />
          <button className="button small" name="action" value="approve">
            Aprovar e publicar
          </button>
        </form>
      )}
      {status === 'pending_review' && (
        <form action={changeAction}>
          <input type="hidden" name="id" value={id} />
          <button
            className="button secondary small"
            name="action"
            value="reject"
          >
            Solicitar revisão
          </button>
        </form>
      )}
      {status === 'approved' && (
        <form
          action={changeAction}
          onSubmit={(event) => {
            if (!confirm('Suspender e retirar este profissional do catálogo?'))
              event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button className="button danger small" name="action" value="suspend">
            Suspender
          </button>
        </form>
      )}
      {status === 'suspended' && (
        <form action={changeAction}>
          <input type="hidden" name="id" value={id} />
          <button
            className="button secondary small"
            name="action"
            value="restore"
          >
            Restaurar
          </button>
        </form>
      )}
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (
            !confirm(
              'Remover definitivamente o cadastro profissional? A conta de login será preservada.',
            )
          )
            event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button className="link-danger">Excluir cadastro</button>
      </form>
    </div>
  );
}
