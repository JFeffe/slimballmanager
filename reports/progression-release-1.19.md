# Progression — version 1.19.0

Les attributs élevés s’accumulaient au fil des saisons. Cette version intègre les quatre règles validées par les essais :

- Gains successifs conservés à 100 % jusqu’à 6, puis 80 / 55 / 25 / 8 % pour atteindre 7 / 8 / 9 / 10. Arrêt au premier point refusé.
- Tardif, 22–26 ans : 0/+1/+2 à 60/35/5 %. Jeune Étoile, 23–27 ans : 62/34/4 %. Filtre de 70 %, temps de jeu et autres courbes conservés.
- Chaque 10 généré ne reste à 10 que dans 20 % des cas; sinon son point est redistribué sous 9, sans changer le budget de grade.
- Après développement habituel, baisse supplémentaire de 1 : 0 % jusqu’à 5, puis 5/10/15/20/25 % aux notes 6/7/8/9/10. Le risque dépend de la note après développement. Déclin d’âge et traitement des agents libres restent actifs.

Aucune migration ni remise à zéro des sauvegardes. L’utilisateur recommence une partie. Les règles sont expliquées dans le tutoriel FR/EN/ES; les bilans conservent les changements nets.

## Contrôles

- Vérifications de génération, budgets de grade et historique initial; fréquences de progression et déclin; gains multiples et conservation des baisses.
- Reprise déterministe au bilan depuis une sauvegarde; cohérence historique / deltas; développement exécuté une fois par saison.
- Multijoueur : refus d’un invité, accord des participants, commande réservée à l’hôte, répétition neutralisée même après rechargement; projections des joueurs identiques pour les clients.
- Contrôle de 20 saisons réelles, graine 91500 : talent, THROW 10, hits, AB, gains et pertes identiques aux résultats expérimentaux sur chaque saison. Voir progression-careers-1.19.json.
- Suivi individuel des joueurs, y compris les jeunes ayant joué et cumulé au moins cinq bilans. Les moyennes de gain au sommet de cette sous-population sont descriptives et soumises à un biais de survie; elles ne garantissent pas la carrière de chaque recrue.
- Le test cosmétique de répartition des portraits vérifie désormais l’utilisation équilibrée des banques par genre, plutôt qu’un nombre accidentel dépendant de la graine sportive.

La sauvegarde personnelle de saison 8 n’a pas été utilisée. Les contrôles d’interface portent sur le rendu HTML, pas une recette visuelle dans un navigateur. Les contrôles multijoueurs vérifient le moteur de commandes et le relais automatisé, pas deux appareils humains connectés.
