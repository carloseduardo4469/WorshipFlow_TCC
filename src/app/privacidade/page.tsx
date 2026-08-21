export default function PrivacidadePage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16 text-paper">
      <h1 className="mb-6 font-display text-2xl font-bold">Privacidade</h1>
      <div className="flex flex-col gap-4 text-sm text-muted">
        <p>
          Guardamos apenas os dados necessários para organizar escalas e repertório: nome, email,
          telefone (opcional) e habilidades musicais.
        </p>
        <p>Suas informações não são compartilhadas com terceiros nem usadas para publicidade.</p>
        <p>Você pode pedir a correção ou remoção dos seus dados a qualquer momento.</p>
      </div>
    </main>
  );
}
