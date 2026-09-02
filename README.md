# Boost Ops — VS Code / Local version

នេះជា version របស់ App ដែលកែសម្រួលឲ្យរត់បាននៅលើម៉ាស៊ីនអ្នក (VS Code, `npm run dev`) ជំនួសឲ្យរត់តែក្នុង Claude.ai។

## តើមានអ្វីខ្លះខុសពី version ក្នុង Claude.ai?

| មុខងារ | Claude.ai | VS Code (version នេះ) |
|---|---|---|
| រក្សាទុកទិន្នន័យ | `window.storage` (shared, cloud) | `localStorage` (រក្សាទុកតែលើ browser របស់អ្នកម្នាក់ឯង មិនចែករំលែកជាមួយក្រុមទេ) |
| ទាញ Boost ស្វ័យប្រវត្តិ (Sync) | ប្រើ session Claude.ai របស់អ្នកផ្ទាល់ | ត្រូវការ Anthropic API key ផ្ទាល់ខ្លួន (មើលខាងក្រោម) |

⚠️ **សំខាន់៖** `localStorage` រក្សាទុកតែក្នុង browser តែមួយ ក្នុងកុំព្យូទ័រតែមួយប៉ុណ្ណោះ។ បើអ្នកចង់ឲ្យក្រុមការងារ ៣នាក់ឃើញទិន្នន័យដូចគ្នា (ដូច version ក្នុង Claude.ai) អ្នកត្រូវការ database ពិត (ឧ. Firebase, Supabase) ដែលមិនមានក្នុង setup នេះទេ។ ខ្ញុំអាចជួយបន្ថែមក្រោយបានបើចង់។

## របៀបដំណើរការ (Setup)

```bash
npm install
npm run dev
```

បើកបាន៖ `http://localhost:5173`

## ការកំណត់ Sync (ស្រេចចិត្ត — មិនចាំបាច់ក៏បាន)

ប៊ូតុង "ទាញ Boost ស្វ័យប្រវត្តិ" នៅ version នេះ **នឹងមិនដំណើរការទេ** លុះត្រាតែអ្នក៖

1. បង្កើត Anthropic API key ពី https://console.anthropic.com
2. បង្កើតឯកសារ `.env` នៅ root project ដាក់៖
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
   ```
3. **ចំណាំសំខាន់អំពីសុវត្ថិភាព៖** ការដាក់ API key ក្នុង code ខាង client (browser) បែបនេះ **មិនមានសុវត្ថិភាពសម្រាប់ production ទេ** ព្រោះអ្នកប្រើប្រាស់ណាមួយអាចមើលឃើញ key របស់អ្នកតាម browser DevTools បាន។ វាសមរម្យសម្រាប់ **តេស local ប៉ុណ្ណោះ**។ បើចង់ deploy ជូនក្រុមការងារពិត ត្រូវធ្វើ backend server តូចមួយ (Node/Express) ដើម្បីលាក់ key ។
4. ចំណាំមួយទៀត៖ ការភ្ជាប់ Supermetrics (Facebook Ads) ក្នុង Claude.ai គឺចងភ្ជាប់ជាមួយគណនី Claude.ai របស់អ្នកផ្ទាល់។ បើប្រើ API key ធម្មតា (មិនមែនចូលតាម Claude.ai) វា **មិនមានការភ្ជាប់ Supermetrics ស្រាប់ទេ** — Sync នឹងបរាជ័យ លុះត្រាតែអ្នកបង្កើត MCP OAuth connection ដោយខ្លួនឯង។ ដូច្នេះមុខងារ Sync ក្នុង version នេះសម្រាប់តែជាគំរូ (reference) មិនមែនប្រើការជាក់ស្តែងភ្លាមៗទេ។

**ដូច្នេះ៖** បើគោលបំណងចម្បងគឺគ្រាន់តែចង់សាកមើល UI/Layout/logic នៅលើ VS Code ដោយមិនប្រើ Sync ទេ អ្នកអាចរំលងជំហាននេះទាំងស្រុង — App នៅតែប្រើការធម្មតា គ្រាន់តែប៊ូតុង Sync នឹងបង្ហាញសារកំហុសប៉ុណ្ណោះ។

## Build សម្រាប់ deploy

```bash
npm run build
```

ចេញជា static files ក្នុង `dist/` — អាចយកទៅដាក់លើ Vercel, Netlify, ឬ hosting ណាមួយ។
