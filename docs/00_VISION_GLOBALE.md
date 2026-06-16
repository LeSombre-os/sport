# Vision Globale — Refonte Application Sport

## Philosophie
L'app est l'outil de terrain (mobile, pendant l'entraînement).
Google Sheets est l'outil d'analyse (PC, après l'entraînement).
Les deux communiquent via un export CSV propre et réutilisable.

## Stack cible
- **Frontend** : HTML/CSS/JS vanilla (pas de framework lourd)
- **Packaging Android** : Capacitor (gratuit, simple, performant)
- **Stockage** : localStorage (données petites), sessionStorage (formulaires)
- **Graphiques** : Chart.js
- **Notifications** : Vibration API + Notification API
- **Export** : CSV format "long" (une ligne par exercice)

## Architecture
`
App Sport
  ├─ Saisie séance → sessionStorage (formulaire)
  ├─ Chrono countdown
  ├─ Journal / Stats ← localStorage (données)
  └─ Export CSV → Google Sheets
`

## Priorités
| Priorité | Fonctionnalité |
|----------|---------------|
| P0 | Persistance des formulaires (sessionStorage) |
| P0 | Chrono countdown par exercice |
| P1 | Export CSV format long (propre pour Sheets) |
| P1 | Refonte UI mobile-first (bottom nav) |
| P2 | Gamification légère (streaks, badges) |
| P2 | Packaging Android (Capacitor) |
