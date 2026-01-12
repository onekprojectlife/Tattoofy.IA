# TattooAI - Gerador de Tatuagens com IA

Aplicação web que usa inteligência artificial do Google Gemini para criar designs únicos de tatuagens e visualizá-los no corpo.

## 🚀 Tecnologias

- React 18 + TypeScript
- Vite 6
- Tailwind CSS
- shadcn/ui
- Google Gemini AI (text) + Imagen 3 (imagens)
- React Router DOM v7

## ⚙️ Configuração da API do Google

Para gerar tatuagens reais com IA, você precisa configurar uma chave de API do Google:

### 1. Obter a API Key

1. Acesse [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

### 2. Configurar no Projeto

1. Copie o arquivo de exemplo:
   ```bash
   cp .env.example .env.local
   ```

2. Abra `.env.local` e adicione sua chave:
   ```env
   VITE_GOOGLE_API_KEY=sua_chave_aqui
   ```

3. Reinicie o servidor de desenvolvimento (se estiver rodando)

### 3. Verificar Configuração

Abra o console do navegador após iniciar a aplicação. Você verá:
- ✅ "Google API configurada com sucesso!" - se a chave estiver configurada
- ⚠️ "GOOGLE_API_KEY não configurada!" - se precisar configurar

## 🎨 Funcionalidades

- **Gerador de Tatuagens**: Descreva sua ideia e a IA cria um design único
- **Biblioteca**: Salve e gerencie suas tatuagens favoritas
- **Experimentar no Corpo**: Veja como a tatuagem ficaria em uma foto sua
  - Ajuste posição, tamanho e rotação
  - Download da prévia

## 🏃 Como Usar

1. **Criar Tatuagem**:
   - Digite uma descrição detalhada (estilo, tema, cores, etc.)
   - Clique em "Gerar Tatuagem"
   - Aguarde a IA criar o design

2. **Salvar na Biblioteca**:
   - Após gerar, clique em "Salvar"
   - Acesse "Minha Biblioteca" para ver todas

3. **Experimentar no Corpo**:
   - Envie uma foto do local onde quer a tatuagem
   - Escolha um design da biblioteca
   - Ajuste posição, tamanho e rotação
   - Baixe o resultado

## 📦 Instalação e Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
