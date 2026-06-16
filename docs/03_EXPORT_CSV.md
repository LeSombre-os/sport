# Export CSV — Format long

## Problème actuel
Colonnes mélangées A/B → inexploitable dans Sheets.
Une ligne = une séance → impossible de filtrer par exo.

## Nouveau format : une ligne = un exercice
`
Programme;Date;Jour;Seance;Exo#;Exercice;Series;RepsObjectif;Leste(kg);RPE;Realise;Notes
Force_Juin2026;2026-06-14;Mer;A;1;Tractions lestees;5;4;6;4;4,4,4,4,4;Tirage explosif
Force_Juin2026;2026-06-14;Mer;A;2;Pistol Squat;4;5/jambe;0;3;5,5,5,5;
`

## Avantages
- ✓ Filtrable par exercice, date, séance
- ✓ Calculs Sheets : volume, progression
- ✓ Pas de colonnes vides
- ✓ Tableau croisé dynamique possible
- ✓ Même structure pour A et B

## Détails
- BOM \uFEFF pour compatibilité Excel/Sheets
- Séparateur : point-virgule (;)
- Encodage UTF-8
