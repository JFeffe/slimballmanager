# Développement et agents libres — 1.12.0

## Changements

Le traitement des agents libres retrouvé dans l'ancien `player_logic.py` est réintégré. La retraite normale demeure le premier tirage; les agents libres survivants sont ensuite soumis au déclin et au deuxième tirage décrits dans `walks-and-legacy-rules.md`. Ce deuxième risque est plafonné à 90 %, mais le risque combiné est `1 − (1 − premier) × (1 − second)`.

Une nouvelle pondération de participation réalise l'intention du document de conception : une variation positive tirée dans la courbe de carrière est conservée avec un coefficient de 25 % sans jouer, 62,5 % à 12 matchs et 100 % à 24 matchs réguliers ou plus. Les baisses ne passent pas par ce filtre. Les profils à progression tardive conservent donc une possibilité de croissance sans contrat, avec le traitement historique de déclin et retraite ensuite applicable.

Les apparitions proviennent des bilans individuels de chaque match terminé, après dédoublonnage par match. Tous les clubs de la saison comptent; séries et matchs en cours sont exclus. Pour une ancienne saison ayant des matchs sans bilans individuels, le nombre retenu est le maximum des apparitions connues et de l'estimation entière `(AB + BB) / 3`, plafonnée à 33 pour l'estimation. Les fiches indiquent alors une approximation. Aucun avantage selon le taux de réussite au bâton n'est ajouté au calcul moderne des apparitions.

## Compatibilité

Les sauvegardes sans compteur démarrent à zéro. Les saisons passées ne sont pas reconstruites et les étapes de développement déjà terminées ne sont pas rejouées. Une signature remet le compteur à zéro. Être agent libre au bilan est le critère historique, pas une année complète réellement passée sans contrat. La progression conservée, le déclin supplémentaire et les retraites sont consignés; les joueurs retraités restent dans les données historiques. Un déclin bloqué au plancher 1 ne produit pas de faux message de perte.

## Protocole

Référence : commit `44a7dda28602e785c4de1b97618a1c9d838c4e72` (correction BB déjà présente). Trois parties de quinze saisons avant et après, graines 92600–92602. Soit 45 saisons et 4 455 matchs réguliers par version, plus leurs séries réellement simulées. Le club utilisateur repêche et aligne automatiquement mais ne signe pas d'agents libres et n'accepte pas les échanges. Ce n'est pas une mesure de difficulté face à un humain actif.

Les saisons d'une même partie ne sont pas indépendantes. Les deux changements sont testés ensemble; les suites aléatoires divergent et leurs contributions individuelles ne sont pas isolées. Les contrôles de compteurs et de structure s'exécutent chaque saison et après l'intersaison.

## Résultats moyens

Les agents libres et le talent sont mesurés en fin de saison, avant le développement et les retraites. Les retraites désignent l'intersaison qui suit.

| Saison | Agents libres avant | Après | Talent effectifs avant /50 | Après /50 |
|---|---:|---:|---:|---:|
| 1 | 12,0 | 12,0 | 26,01 | 26,01 |
| 5 | 89,7 | 38,3 | 31,37 | 30,92 |
| 10 | 179,0 | 48,3 | 36,35 | 34,40 |
| 15 | 237,3 | 43,7 | 38,58 | 34,90 |

| Saison | Retraites totales avant | Après | Dont deuxième tirage agents libres après |
|---|---:|---:|---:|
| 5 | 5,3 | 19,7 | 18,7 |
| 10 | 6,7 | 25,7 | 25,0 |
| 15 | 19,3 | 25,7 | 24,3 |

À la saison 15, les agents libres sans aucune participation régulière passent de 146 à 26,7; leur talent moyen global passe de 26,34 à 23,61/50. La population du marché se rapproche d'un équilibre dans ces échantillons, avec environ 24 recrues entrantes et 26 retraites à la fin des saisons 10 et 15. Cela ne garantit pas une stabilité identique dans toutes les parties, et les règles historiques peuvent provoquer des retraites jeunes, même dès le premier bilan sans contrat.

## Vérification et reproduction

Tests ciblés : participation malgré un changement de club, exclusion des séries et des matchs inachevés, estimation des anciens bilans, fréquence des gains avec/sans jeu, déclin lié à l'âge inchangé, seuils de retraite, déclin dans les bilans, remise à zéro du compteur, import/export et retrait unique. Les contrôles de rendu vérifient les fiches, les nouveaux journaux et les règles en trois langues, avec un DOM minimal; ils ne constituent pas une inspection visuelle dans un navigateur.

`node scripts/balance-development.mjs /chemin/absolu/dist/engine.js /tmp/development.json`

Le quatrième argument optionnel détermine le nombre de saisons (15 par défaut). Pour la référence, fournir les modules du commit ci-dessus dans un dossier ESM distinct. Données conservées : `development-before.json` et `development-after.json`.

Validation finale : **75 tests réussis**, aucune erreur dans les 90 saisons comparées.
