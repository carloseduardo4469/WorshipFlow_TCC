import { Database, Eye, Mail, ShieldCheck, Trash2, UserRoundCheck } from "lucide-react";
import { LegalShell } from "@/components/legal/LegalShell";

export default function PrivacidadePage() {
  return (
    <LegalShell currentPage="privacidade">
      <section className="legal-hero">
        <p className="legal-eyebrow"><ShieldCheck size={14} /> Seus dados</p>
        <h1>Privacidade</h1>
        <p>Entenda quais informações são utilizadas e como o WorshipFlow protege os dados da equipe ministerial.</p>
        <span className="legal-updated">Última atualização: agosto de 2026</span>
      </section>
      <div className="legal-content">
        <section className="legal-card"><span className="legal-card-icon"><Database size={19} /></span><div><h2>Dados armazenados</h2><p>Guardamos nome, e-mail, telefone, foto de perfil, habilidades musicais e informações necessárias para organizar escalas e repertórios.</p></div></section>
        <section className="legal-card"><span className="legal-card-icon"><Eye size={19} /></span><div><h2>Como utilizamos</h2><p>As informações são utilizadas somente para autenticação, gestão da equipe e funcionamento das atividades ministeriais. Não utilizamos seus dados para publicidade.</p></div></section>
        <section className="legal-card"><span className="legal-card-icon"><UserRoundCheck size={19} /></span><div><h2>Compartilhamento</h2><p>Os dados ficam disponíveis apenas às pessoas autorizadas no sistema e aos serviços técnicos necessários para autenticação, hospedagem e armazenamento.</p></div></section>
        <section className="legal-card"><span className="legal-card-icon"><Trash2 size={19} /></span><div><h2>Correção e exclusão</h2><p>Você pode atualizar seus dados pelo perfil e solicitar correção ou exclusão da conta. Algumas informações podem ser preservadas quando necessárias à segurança ou integridade dos registros.</p></div></section>
        <section id="contato" className="legal-contact"><span className="legal-contact-icon"><Mail size={21} /></span><div><p className="legal-eyebrow">Contato e privacidade</p><h2>Quer revisar seus dados?</h2><p>Envie uma solicitação para esclarecer dúvidas ou exercer seus direitos relacionados aos dados pessoais.</p><a href="mailto:Lucasavilagodoi43@gmail.com">Lucasavilagodoi43@gmail.com</a></div></section>
      </div>
    </LegalShell>
  );
}
