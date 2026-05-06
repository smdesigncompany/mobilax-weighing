# Mobilax Weighing

Application de pesée & volumétrie connectée Hengxun.

- **App desktop installable** sur Mac (.dmg) et Windows (.exe) — Electron
- **API en ligne** (déployable séparément sur VPS/cloud)
- **Web** (optionnel, pour accès navigateur)

## Architecture

```
┌─────────────────────────────────────────┐
│  API en ligne (Node + WebSocket)        │
│  https://api.mobilax.app                │
└──────────────┬──────────┬───────────────┘
               │          │
       HTTP POST       WSS push live
               │          │
   ┌───────────┴──┐  ┌────┴────────────────┐
   │ Hengxun      │  │ App Mac/Windows     │
   │ (entrepôt)   │  │ (Electron)          │
   └──────────────┘  └─────────────────────┘
```

L'app desktop **ne contient pas le serveur** — elle se connecte à l'API en ligne via une URL configurable depuis ses Réglages.

## 1. Lancer en dev sur Mac

```bash
npm install
npm run dev          # web (http://localhost:5173) + backend
# ou
npm run dev:electron # app desktop + backend + frontend
```

⚠️ Si tu as `ELECTRON_RUN_AS_NODE=1` dans ton shell, le launcher dans `scripts/launch-electron.js` le retire automatiquement.

## 2. Tester sans Hengxun

Cliquer **"Simuler un colis"** dans l'app — chaque clic génère un poids/dims/volume/code aléatoires + le QR code se met à jour.

## 3. Déployer l'API en ligne

L'API c'est juste `server/`. Sur un VPS :

```bash
git clone <repo>
cd mobilax-weighing
npm install --omit=dev
npm run start:server  # http://<ip>:4000
```

Mettre derrière nginx + Let's Encrypt pour avoir HTTPS/WSS :
```
https://api.mobilax.app  →  proxy_pass http://localhost:4000
                            proxy_set_header Upgrade $http_upgrade
                            proxy_set_header Connection "upgrade"
```

Hengxun POST → `https://api.mobilax.app/api/hengxun/data`

## 4. Builder l'app desktop

### Mac (.dmg)
```bash
npm run build:web
npx electron-builder --mac
```
→ `release/Mobilax-Weighing-0.1.0.dmg`

### Windows (.exe) — depuis Windows
```powershell
npm install
npm run build:web
npx electron-builder --win
```
→ `release/Mobilax-Weighing-Setup-0.1.0.exe`

Cross-build Windows depuis Mac : possible avec wine, mais préfère builder sur Windows.

## 5. Configurer l'app après installation

À la première ouverture, cliquer **"Réglages"** (en haut à droite) → saisir l'URL de l'API en ligne :
```
https://api.mobilax.app
```
L'URL est stockée dans `localStorage` du poste, persiste entre redémarrages.

## Structure du projet

```
electron/         # wrapper desktop (Mac/Windows)
  main.js         # process principal
  preload.js      # bridge sécurisé (réservé futur)
scripts/
  launch-electron.js  # lance Electron en nettoyant l'env
server/           # API Node.js (déployable seul)
  index.js        # Express + WebSocket
  hengxun/        # listener TCP optionnel
src/
  atoms/          # Card, Label, Value, Badge, Button, StatusDot
  molecules/      # MeasureField, ConnectionStatus, CodeDisplay,
                  # StatusIndicator, SettingsButton
  organisms/      # WeightPanel, DimensionsPanel, QRPanel,
                  # Header, SimulatorBar
  templates/      # PreparerLayout
  pages/          # PreparerPage
  store/          # Zustand + selectors (anti re-render)
  services/       # socket (singleton WS), config, qrService
```

## Endpoints API

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/hengxun/data` | Hengxun envoie une mesure JSON |
| POST | `/api/hengxun/image` | Hengxun envoie une image (placeholder) |
| GET | `/api/last` | Dernière mesure connue |
| POST | `/api/dev/simulate` | Génère une mesure aléatoire (mode test) |
| GET | `/api/health` | Healthcheck |
| WS | `/ws` | Push live des mesures vers l'UI |

## Code colis

- Hengxun renvoie un code-barres → utilisé tel quel (badge **"Code scanné"**)
- Sinon → code interne `MBX-YYYYMMDD-XXXXXX` généré (badge **"Code généré"**)
- Le QR contient toujours le code colis + poids + dims + volume
