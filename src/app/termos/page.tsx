import { Database, LockKeyhole, Mail, Scale, ShieldCheck, Users } from "lucide-react";
import { LegalShell } from "@/components/legal/LegalShell";

export default function TermosPage() {
  return (
    <LegalShell currentPage="termos">
      <section className="legal-hero">
        <p className="legal-eyebrow"><Scale size={14} /> Documento institucional</p>
        <h1>Termos de uso</h1>
        <p>Regras simples para utilizar o WorshipFlow com segurança, responsabilidade e respeito à equipe do ministério.</p>
        <span className="legal-updated">Última atualização: agosto de 2026</span>
      </section>
      <div className="legal-content">
        <section className="legal-card"><span className="legal-card-icon"><Users size={19} /></span><div><h2>Finalidade do sistema</h2><p>O WorshipFlow organiza escalas, repertórios, músicas, funções e informações da equipe de louvor. O acesso deve ser usado somente para atividades relacionadas ao ministério.</p></div></section>
        <section className="legal-card"><span className="legal-card-icon"><LockKeyhole size={19} /></span><div><h2>Conta e acesso</h2><p>Cada pessoa é responsável por manter sua senha protegida e por informar dados corretos. Contas podem ser suspensas quando houver uso indevido ou risco para a equipe.</p></div></section>
        <section className="legal-card"><span className="legal-card-icon"><Database size={19} /></span><div><h2>Conteúdo cadastrado</h2><p>Músicas, escalas e demais registros devem respeitar a finalidade do sistema. Informações incorretas ou inadequadas podem ser corrigidas ou removidas pela administração.</p></div></section>
        <section className="legal-card"><span className="legal-card-icon"><ShieldCheck size={19} /></span><div><h2>Disponibilidade</h2><p>O sistema pode receber atualizações, correções ou interrupções temporárias. Buscamos preservar os dados e manter o serviço estável, mas não garantimos funcionamento ininterrupto.</p></div></section>
        <section id="contato" className="legal-contact"><span className="legal-contact-icon"><Mail size={21} /></span><div><p className="legal-eyebrow">Contato</p><h2>Precisa falar conosco?</h2><p>Para dúvidas sobre os termos, privacidade ou utilização do WorshipFlow, envie um e-mail.</p><a href="mailto:Lucasavilagodoi43@gmail.com">Lucasavilagodoi43@gmail.com</a></div></section>
      </div>
    </LegalShell>
  );
}
