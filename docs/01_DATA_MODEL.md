# Modèle de Données — Nouvelle Version

## Nouveau modèle

### Programme
`
Program {
  id, name, sessions[]
}

Session {
  id: "A"|"B", label, focus, color, exercises[]
}

Exercise {
  num, name, sets, reps, initialWeight, restSeconds, note
}
`

### Logs (séances enregistrées)
`
WorkoutLog {
  id, date, sessionId, duration?, exercises[]
}

ExerciseLog {
  exerciseNum, weight, performed, rpe, note, restTaken?
}
`

### Formulaire persisté (sessionStorage)
`
FormSession {
  sessionId, lastUpdated, exercises: { num: { weight, performed, rpe, note } }
}
`

### Gamification
`
Badge { id, name, desc, icon, earned, earnedDate? }
UserStats { totalWorkouts, currentStreak, longestStreak, lastWorkoutDate, badges[] }
`

## Changements clés
- **Export long** : 1 ligne = 1 exercice → filtrable dans Sheets
- **sessionStorage** : formulaire survit aux changements d'app
- **restSeconds** : en secondes → prêt pour le chrono
