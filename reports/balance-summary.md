# Slimball Manager — Bilan d’équilibrage sur plusieurs saisons

## Protocole

Douze simulations de dix saisons avant correction et douze après, avec les mêmes graines 91200 à 91211. Tous les matchs de saison régulière et des séries sont joués par le moteur, sans résultats fabriqués. Le mode libre permet de poursuivre même lorsqu’un titre aurait terminé une carrière.

Le club utilisateur est un témoin : repêchage et alignement automatiques, sans signatures manuelles ni acceptation d’offres. Les cinq NPC utilisent leurs décisions autonomes. Il ne s’agit donc pas de six gestionnaires équivalents. Les écarts de victoires sont calculés entre NPC seulement. Chaque fin de saison et chaque transition d’intersaison subit la validation structurelle des sauvegardes.

Référence avant correction : `f03786a906ac5a2bf06d33b7d6503f77042c7818`. Les données brutes sont conservées dans `balance-before.json`, `balance-after.json` et `balance-long-run.json`, avec leurs protocoles. La comparaison porte sur les trois corrections ensemble; elle n’isole pas statistiquement leur contribution individuelle.

## Corrections

1. **Anniversaire du jour zéro.** Le passage à la nouvelle saison omettait cet anniversaire. Ces joueurs ne vieillissaient jamais, ce qui faussait à terme leur progression et leur retraite. L’anniversaire est maintenant traité une seule fois, y compris lors de la transition des anciennes sauvegardes. Aucun rattrapage d’âge arbitraire n’est appliqué aux joueurs existants.
2. **Volume de recrues.** Le repêchage annuel propose désormais 24 recrues pour 12 choix, au lieu de 40 à 60. Le bassin initial de 60 joueurs et ses 48 choix restent inchangés. Les classes déjà générées dans une sauvegarde sont conservées.
3. **Priorité du marché NPC.** L’ordre d’accès aux agents libres tourne entre les cinq NPC. Chaque club obtient le premier accès une fois sur cinq fenêtres; son identifiant ne lui donne plus une priorité permanente. Le recrutement continue à respecter les postes, la stratégie du club et les offres en cours.

Les probabilités de progression par forme de carrière, les probabilités de retraite, les attributs existants et les règles des matchs n’ont pas été modifiés.

## Résultats avant / après

| Indicateur | Avant | Après |
|---|---:|---:|
| Agents libres en saison 10 | 403.58 | 179.75 |
| Talent moyen des effectifs en saison 10, sur 50 | 38.95 | 35.94 |
| Âge moyen des effectifs en saison 10 | 25.51 | 25.91 |
| Clubs champions différents par carrière de 10 saisons | 4.67 | 4.58 |
| Plus longue série de titres consécutifs observée | 3.00 | 4.00 |
| Écart de victoires entre NPC en saison 10 | 9.00 | 8.50 |

Le talent indiqué est la somme des cinq attributs, chacun sur dix. Ce n’est **pas** la valeur d’échange.

La réduction des entrées limite l’accumulation d’agents libres et ralentit la hausse du talent moyen des effectifs par sélection des meilleurs joueurs disponibles. La diversité des champions reste proche. La série maximale de titres augmente de trois à quatre : ces échantillons ne démontrent donc pas une diminution des dynasties, et aucune redistribution artificielle des victoires n’a été ajoutée.

## Reproduction

Depuis la racine du projet :

```sh
node scripts/balance-seasons.mjs 12 10 /tmp/balance.json
node scripts/balance-seasons.mjs 3 25 /tmp/balance-long.json
npm test
```

Pour reproduire la référence avant correction, employer ce même script avec le moteur du commit de référence. Les résultats narratifs et les temps d’exécution ne constituent pas des critères d’équilibrage. La vérification de reprise par export/import et les anniversaires sont couverts par les tests automatisés.

## Vérification prolongée sur 25 saisons

Trois des mêmes graines (91200 à 91202) ont été prolongées à 25 saisons avec les corrections. Il s’agit d’une vérification complémentaire; leurs dix premières saisons ne sont pas trois nouveaux échantillons indépendants.

| Saison | Agents libres moyens | Talent moyen des effectifs / 50 | Âge moyen | Retraites annuelles |
|---|---:|---:|---:|---:|
| 10 | 178.00 | 35.72 | 25.69 | 10.33 |
| 15 | 243.33 | 37.78 | 27.08 | 15.33 |
| 20 | 257.00 | 38.52 | 27.34 | 20.00 |
| 25 | 261.33 | 37.90 | 27.54 | 22.00 |

Le bassin se rapproche d’un plateau dans ces trois simulations : 257 agents libres en saison 20 et 261 en saison 25, avec 22 retraites annuelles pour 24 entrées en fin de période. Le talent moyen cesse également de monter continuellement. Les six clubs ont remporté au moins un titre dans chacune des trois carrières prolongées; la plus longue série observée est de quatre titres. Ces observations restent celles d’un échantillon, pas une garantie de tous les parcours possibles.

**Validation : 60 tests réussis**, dont les 48 dates d’anniversaire, le passage d’une ancienne sauvegarde à la nouvelle saison, la reprise par export/import, les effectifs après repêchage et la rotation de priorité du marché. Aucun test visuel supplémentaire n’était nécessaire pour ces changements de simulation.
