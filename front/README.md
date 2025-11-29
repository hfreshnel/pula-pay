# Pulapay — Front-end

# Description

Front-end de l'application Pulapay — une interface web pour un portefeuille mobile / service de paiement. Cette application est construite avec React + Vite et fournit les vues utilisateur : tableau de bord, portefeuille, rechargement (top-up), retrait, transferts P2P, historique des transactions, profil, et pages de gestion (factures, assistant, etc.).

- Objectif principal

	Fournir une interface utilisateur moderne, responsive et sécurisée pour gérer les paiements, transferts et l'historique des transactions côté client.

- Modules principaux

	- `src/pages/` : pages de l'application (Dashboard, TopUp, Withdraw, P2PTransfer, Transactions, Profile, Login, Register, etc.)
	- `src/components/` : composants UI réutilisables (cartes, boutons, champs, tableau de bord, widgets)
	- `src/hooks/` : hooks personnalisés (auth, transactions, useDeposit/useWithdraw/useTransfer, etc.)
	- `src/api/` : clients et intégrations pour appeler l'API backend
	- `src/lib/` : utilitaires partagés (formatage, validation légère, helpers)
	- `src/styles` / `tailwind.config.js` : configuration et styles UI

- Dépendances externes (submodules)

	- React + react-dom
	- Vite (dev server & build)
	- react-router-dom (routing)
	- tailwindcss (UI styling)
	- lucide-react (icônes)
	- react-phone-input-2 (champ téléphone)
	- date-fns (formatage des dates)
	- d'autres utilitaires selon `package.json` (axios/fetch wrappers, form libs, etc.)

- Mode d'exécution

	Clone ou placez-vous dans le dossier `front/` puis installez et lancez l'app en mode développement :

	```bash
	# depuis la racine du projet (ou d:\dev\git\NodeJS\pula-pay\front)
	npm install
	npm run dev
	```

	Pour construire l'application pour la production :

	```bash
	npm run build
	npm run preview    # (optionnel) pour prévisualiser le build localement
	```

	Variables d'environnement utiles (exemples) :

	- `VITE_API_BASE_URL` : URL du backend (ex. `http://localhost:3000`)

	Notes :
	- L'application attend un backend compatible (endpoints utilisateurs, transactions, paiements). Voir le dossier `back/` du repo pour le serveur et la configuration Prisma.


