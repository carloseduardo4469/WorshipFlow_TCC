# Configuração de confirmação de email

O código do WorshipFlow recebe confirmações em `/auth/confirm` usando `token_hash`. Para ativar esse fluxo no Supabase:

1. Abra **Authentication > Email Templates > Confirm signup**.
2. No botão ou link de confirmação, substitua `{{ .ConfirmationURL }}` por:

```html
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

3. Em **Authentication > URL Configuration**, defina **Site URL** com a URL pública do site.
4. Adicione nas **Redirect URLs** a URL pública e, para desenvolvimento, `http://localhost:3000/**`.

## Evitar que os emails caiam no spam

O SMTP padrão do Supabase é apenas para testes. Em produção:

1. Configure um provedor como Resend, Postmark, Brevo, SendGrid ou Amazon SES.
2. Ative-o em **Authentication > Emails > SMTP Settings**.
3. Use um remetente do seu domínio, por exemplo `no-reply@auth.seudominio.com.br`.
4. Cadastre no DNS os registros SPF e DKIM fornecidos pelo provedor.
5. Cadastre uma política DMARC para o domínio.
6. Desative rastreamento de links no provedor de email, pois ele pode alterar links de confirmação.
7. Mantenha o email curto, sem conteúdo promocional, excesso de imagens ou vários links.

Depois da alteração do template, links enviados anteriormente continuarão usando o fluxo antigo. Faça um novo cadastro ou reenvie a confirmação para testar.
