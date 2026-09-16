'use client';

import { useFormStatus } from 'react-dom';
import { changeProfessionalSubscription } from '@/app/admin/actions';

function SubscriptionSubmitButton({ active }: { active: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className={active ? 'button danger small' : 'button small'}
      type="submit"
      name="subscriptionAction"
      value={active ? 'deactivate' : 'activate'}
      disabled={pending}
    >
      {pending
        ? active
          ? 'Desativando...'
          : 'Ativando...'
        : active
          ? 'Desativar assinatura'
          : 'Ativar assinatura'}
    </button>
  );
}

export function SubscriptionActions({
  professionalId,
  active,
}: {
  professionalId: string;
  active: boolean;
}) {
  return (
    <form
      action={changeProfessionalSubscription}
      className="subscription-admin-form"
      onSubmit={(event) => {
        const action = active ? 'desativar' : 'ativar';
        if (!confirm(`Deseja ${action} esta assinatura?`))
          event.preventDefault();
      }}
    >
      <input type="hidden" name="professionalId" value={professionalId} />
      <label>
        Nota administrativa (opcional)
        <textarea
          name="adminNote"
          rows={3}
          maxLength={1000}
          placeholder="Ex.: Cortesia por 6 meses"
        />
      </label>
      <SubscriptionSubmitButton active={active} />
    </form>
  );
}
