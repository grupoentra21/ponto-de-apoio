'use client';

import { useFormStatus } from 'react-dom';

export function ProfessionalSaveButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? 'Salvando dados...' : 'Salvar dados'}
    </button>
  );
}
