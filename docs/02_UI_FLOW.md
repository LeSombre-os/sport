# UI/UX — Nouveau Design & Flux

## Navigation : Bottom Tab Bar
`
┌──────────────────────┐
│      [HEADER]        │
│                      │
│   [CONTENU PRINCIPAL]│
│                      │
│                      │
├──────────────────────┤
│ 📋  💪  📊  ⚙️     │
│Prog Saisir Stats Réglages│
└──────────────────────┘
`

## Onglets

### 1. Programme (📋)
- Séances A/B dépliables
- Exercices avec progression visuelle
- Tap sur un exo → détails + historique

### 2. Saisir (💪) — CŒUR
Flux guidé étape par étape :
- Étape 1 : Choisir séance
- Étape 2 : Exercice en cours (1/4) avec chrono
- Étape 3 : Récapitulatif + validation

### 3. Stats (📊)
- Chart.js pour graphiques progression
- Streak + badges

### 4. Réglages (⚙️)
- Export CSV, code WhatsApp, badges, reset

## Chrono countdown
- Bouton Démarrer le repos à côté de chaque exo
- Durée pré-remplie depuis le programme
- +30s, -30s, Pause, Skip
- Vibration à la fin
- Popup avec infos de l'exercice suivant

## Persistance formulaire
- Tous les champs → sessionStorage à chaque modification
- Restauré au retour dans l'onglet Saisir
- Effacé après validation ou annulation

## Responsive
- Mobile < 480px : bottom nav, plein écran
- Desktop > 820px : centré, max-width
- Toujours portrait-first
