export const supportSteps = [
  {
    number: '01',
    title: 'Converse no seu ritmo',
    text: 'Um espaço inicial acolhedor para organizar o que você está sentindo.',
  },
  {
    number: '02',
    title: 'Entenda possibilidades',
    text: 'Receba orientações gerais sobre áreas de atendimento que podem fazer sentido.',
  },
  {
    number: '03',
    title: 'Encontre apoio profissional',
    text: 'Conheça profissionais e escolha com autonomia quem combina com você.',
  },
];

export function HowItWorks({ intro }: { intro?: string }) {
  return (
    <div className="container">
      <p className="eyebrow">Como funciona</p>
      <h2 className="section-title">Clareza para dar o próximo passo</h2>
      {intro && <p className="section-intro">{intro}</p>}
      <div className="steps-grid">
        {supportSteps.map(({ number, title, text }) => (
          <article className="surface step-card" key={number}>
            <span className="eyebrow">{number}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
