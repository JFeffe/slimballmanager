# Diagnostic du classement défensif — 19 septembre 2026

## Méthode

Moteur de référence : 5f4c6cfaf199333322b9b1405c278ba1e453f18e. Trois variantes : actuel, modéré, linéaire plus sévère. Pour chacune : 30 premières saisons indépendantes, puis trois ligues de huit saisons. Total 162 saisons simulées, soit 16 038 matchs réguliers, plus les séries. Les mesures utilisent seulement les statistiques de saison régulière. Alignements et repêchages automatiques; aucune intervention manuelle. Structures de sauvegarde et égalités comptables des statistiques vérifiées. Les neuf observations matures de chaque variante sont les saisons 6 à 8 de trois ligues : elles ne sont pas indépendantes.

## Diagnostic du code

Le calcul actuel est (balles jouées − erreurs) / balles jouées. Le compteur de balles augmente avant la résolution du jeu, y compris pour un coup sûr ou un circuit. Le seuil du classement est 10 balles; seuls les dix premiers sont affichés. Le départage initial utilisait l’identifiant interne.

Une erreur exige deux succès successifs du test slim(1, CAT + SPE). Sa probabilité exacte est 1 / (1 + CAT effectif + SPE effectif)². Avec CAT = SPE = 6, elle vaut environ 0,59 % par balle. La fatigue influence les capacités effectives.

La formule officielle est (retraits + assistances) / (retraits + assistances + erreurs). [MLB](https://www.mlb.com/glossary/standard-stats/fielding-percentage). L’adaptation aux compteurs disponibles dans Slimball serait (catchOuts + throwOuts) / (catchOuts + throwOuts + errors). Le jeu ne crédite pas séparément une assistance et une réception lors de chaque retrait sur relais : ce serait donc une adaptation, pas une reproduction complète du comptage MLB.

## Résultats

Les moyennes défensives ci-dessous sont calculées sur les totaux de la ligue. Les joueurs parfaits sont ceux du classement actuel admissibles avec au moins 10 balles et aucune erreur. Les erreurs par match réunissent les deux équipes.

| Période | Variante | Erreurs / match | % actuel | % adapté | Joueurs à 100 % | Joueurs parfaits dans le top 10 |
|---|---|---:|---:|---:|---:|---:|
| Saison 1 | current | 0.38 | 99.14 | 98.43 | 49.10 | 10.00 |
| Saison 1 | moderate | 0.56 | 98.73 | 97.70 | 36.88 | 10.00 |
| Saison 1 | linear | 1.13 | 97.45 | 95.41 | 11.32 | 5.43 |
| Saisons 6–8 | current | 0.31 | 99.39 | 98.98 | 61.11 | 10.00 |
| Saisons 6–8 | moderate | 0.49 | 99.02 | 98.38 | 44.44 | 10.00 |
| Saisons 6–8 | linear | 1.07 | 97.85 | 96.47 | 20.14 | 8.44 |

## Variantes expérimentales

- Actuel : `1 / (1 + CAT + SPE)^2`.
- Modéré : `max(0.006, 1.5 / (1 + CAT + SPE)^2)`.
- Linéaire : `max(0.006, min(0.045, 0.045 - 0.0022 * (CAT + SPE - 2)))`.
- Les deux variantes expérimentales utilisent un seul tirage. Les séquences aléatoires divergent ensuite; les mêmes graines ne produisent pas des matchs identiques.

## Interprétation et recommandation

La formule actuelle gonfle la moyenne en traitant les coups sûrs comme des occasions sans erreur. Corriger le dénominateur ne supprime cependant aucun 100 % chez un joueur sans erreur. Même avec le modèle modéré, chaque top 10 des 30 premières saisons testées reste à 100 %. Le seul affichage des dix premiers accentue donc fortement cette impression.

Recommandation : adopter ensuite le pourcentage adapté aux retraits et erreurs, afficher son volume correspondant, conserver le départage par volume puis nom, et envisager le modèle modéré. Ne pas choisir un taux élevé uniquement pour éliminer les 100 %. Le modèle linéaire descend à 95,41 % avec le dénominateur adapté en première saison, et modifie davantage les résultats des matchs. Aucun taux cible amateur ou MLB précis n’a été établi ici.

Un seuil de 30 occasions adaptées conserverait environ 44,6 joueurs admissibles sur 48 en première saison avec le moteur actuel, dont 21,5 encore parfaits. Monter le seuil ne résout donc pas seul le problème des égalités. Les premiers jours et les séries demanderaient un seuil adapté à leur durée.

## Changements publiables dans cette tâche

Ajout des colonnes Balles jouées et Erreurs; départage des pourcentages exacts égaux par volume décroissant, puis nom alphabétique, avec identifiant stable uniquement pour les homonymes. Explication du seuil et de l’arrondi. Les probabilités d’erreur et le calcul du pourcentage restent ceux du moteur actuel, en attente du choix de calibration.

Reproduction : `node scripts/test-fielding.mjs`. Données : `reports/fielding-experiment.json`.
