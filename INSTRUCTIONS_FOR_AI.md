# ⚙️ Chaves de API & Instruções para Desenvolvimento (ProspectMap)

Este arquivo foi criado para armazenar com segurança as credenciais do projeto e servir como guia de integração/desenvolvimento para as próximas IAs que trabalharem neste repositório.

---

## 🔑 Credenciais do Projeto

### 1. ⚡ Supabase (Banco de Dados PostgreSQL & SDK API)
*   **URL do Projeto:** `https://YOUR_PROJECT_ID.supabase.co`
*   **API Rest/v1 URL:** `https://YOUR_PROJECT_ID.supabase.co/rest/v1/`
*   **Chave da API / Secret (Database Password):** `YOUR_SUPABASE_DATABASE_PASSWORD`
*   **String de Conexão (DATABASE_URL no `.env` e `vercel.json`):**
    ```env
    DATABASE_URL="postgresql://postgres:YOUR_SUPABASE_DATABASE_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres"
    ```
*   **Supabase Public Credentials (adicionadas ao `.env`):**
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
    ```
    *(Nota: Se o Supabase estiver pausado, ative-o no painel clicando em "Restore Project")*

### 2. 📡 Apify (Scraper do Google Maps)
*   **Chave/Token da API:** `YOUR_APIFY_API_TOKEN`
*   **Variável no `.env`:** `APIFY_API_TOKEN`

### 🔺 3. Vercel (Hospedagem & Deploy)
*   **ID do Projeto:** `prj_sWCeio7hJcgH3VFtj4rW3JKe5yAk`
*   **Projeto Vercel:** `guelf-s-projects/extracted`
*   **Domínio de Produção:** [https://extracted-olive.vercel.app](https://extracted-olive.vercel.app)
*   **Token Utilizado:** Vinculado localmente via login interativo do CLI.

---

## 📂 SDK Supabase & Helpers Adicionados

Instalamos as dependências `@supabase/supabase-js` e `@supabase/ssr` e criamos os seguintes auxiliares oficiais de Next.js:
*   [utils/supabase/client.ts](file:///c:/Users/berto/Downloads/leadzap%2001/leadzap02%20codex%20que%20mexeu/extracted/utils/supabase/client.ts) (Browser client helper)
*   [utils/supabase/server.ts](file:///c:/Users/berto/Downloads/leadzap%2001/leadzap02%20codex%20que%20mexeu/extracted/utils/supabase/server.ts) (Server component client helper com suporte a Cookies)
*   [utils/supabase/middleware.ts](file:///c:/Users/berto/Downloads/leadzap%2001/leadzap02%20codex%20que%20mexeu/extracted/utils/supabase/middleware.ts) (Middleware helper para refrescar sessões expiradas)

---

## 🛡️ Arquitetura de Resiliência Offline (Muito Importante!)

Para evitar erros como o "Erro ao prospectar" quando o banco de dados Supabase estiver offline, pausado ou instável, implementamos fallbacks locais baseados em arquivos JSON:

1.  **Leads Fallback (`prisma/local_leads_fallback.json`):**
    *   Armazena e lê os leads, mensagens e dados de prospecção caso o Prisma falhe em se conectar com o Supabase.
2.  **Sales Fallback (`prisma/local_sales_fallback.json`):**
    *   Registra faturamentos e vendas localmente para manter o Dashboard ativo e o ranking funcional durante quedas de banco.
3.  **Configurações e Perfil (`/api/me`):**
    *   Protegido contra falhas do Prisma para manter o painel administrativo acessível via `/bypass`.

**⚠️ Regra para novas IAs:** Sempre mantenha as rotas de API protegidas com `try/catch` que fazem o chaveamento para os arquivos locais caso a conexão com a variável `DATABASE_URL` falhe.

---

## 🛠️ Comandos Úteis no Terminal

*   **Verificar Tipagem e Compilar:**
    ```bash
    npm run build
    ```
*   **Rodar em Desenvolvimento:**
    ```bash
    npm run dev
    ```
*   **Deploy para Produção na Vercel:**
    ```bash
    npx vercel --prod --yes
    ```
