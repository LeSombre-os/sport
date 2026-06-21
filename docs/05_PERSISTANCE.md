# Persistance des Données

## Problème
Les données du formulaire de saisie sont perdues si on change d'application.

## Solution : sessionStorage

### Flux
1. Utilisateur ouvre "Saisir"
2. Restaure depuis sessionStorage si existant
3. À chaque input → sauvegarde auto dans sessionStorage
4. Switch d'app → sessionStorage intact
5. Retour → formulaire rempli
6. Validation → sessionStorage vidé

### Structure sauvegardée
`
{
  sessionId: "A",
  lastUpdated: timestamp,
  exercises: {
    0: { weight: 6, performed: "4,4,4,4,4", rpe: 4, note: "" },
    1: { ... }
  }
}
`

### Nettoyage
- Quand la séance est enregistrée
- Quand l'utilisateur change de séance
- Quand l'utilisateur annule
