export type Professional = {
  id: string;
  name: string;
  profession: string;
  registration: string;
  specialties: string[];
  serviceMode: string;
  city: string;
  bio: string;
};
export const mockProfessionals: Professional[] = [
  {
    id: 'demo-ana',
    name: 'Ana Martins',
    profession: 'Psicóloga',
    registration: 'CRP 00/00000',
    specialties: ['Ansiedade', 'Autoconhecimento'],
    serviceMode: 'Online',
    city: 'Florianópolis, SC',
    bio: 'Atendimento acolhedor para adultos, com foco na construção de recursos para o cotidiano.',
  },
  {
    id: 'demo-caio',
    name: 'Caio Ribeiro',
    profession: 'Psicólogo',
    registration: 'CRP 00/00000',
    specialties: ['Relacionamentos', 'Luto'],
    serviceMode: 'Presencial e online',
    city: 'Blumenau, SC',
    bio: 'Escuta voltada a mudanças de vida, vínculos e processos de perda.',
  },
  {
    id: 'demo-livia',
    name: 'Lívia Souza',
    profession: 'Psicóloga',
    registration: 'CRP 00/00000',
    specialties: ['Estresse', 'Carreira'],
    serviceMode: 'Online',
    city: 'Curitiba, PR',
    bio: 'Acompanhamento de adultos em momentos de sobrecarga e transição profissional.',
  },
];
