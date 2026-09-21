# Buts sur balles et règles historiques — 13 septembre 2026

> Constat historique au moment de la version 1.11.1. Le traitement des agents libres est désormais réintégré dans la version 1.12.0, avec pondération du temps de jeu : voir `development-balance.md`.

## Correction des buts sur balles

Référence avant : cfdbe51b7532a4f76ae48b96120947cf49902262. Après : correction du test BB uniquement, sans changement des retraites, des courbes de développement ou du repêchage.

Le contrôle est effectué après le retrait sur prises. Probabilité conditionnelle : `(12 − lancer effectif) / 40`, pour un lancer effectif compris entre 1 et 10. Un seul tirage remplace les deux tests précédents. La capacité effective tient compte de la fatigue existante. Le contrôle décroît de 27,5 % à 5 %; la probabilité totale par présence est plus basse à cause du test préalable de retrait sur prises. Les calculs affichés dans les événements sont les poids réels du tirage.

## Comparaison par simulation

Trois parties de dix saisons, graines 92500–92502, avant et après : 2 970 matchs réguliers par version, plus les séries réellement simulées. Statistiques ci-dessous : saison régulière seulement, agrégées par présence ou match; pas une moyenne de pourcentages individuels. Les saisons d'une même partie ne sont pas indépendantes. Les suites aléatoires divergent après modification; ceci est une comparaison du système complet, pas des matchs appariés action par action. Le club utilisateur repêche et aligne automatiquement, mais ne signe pas d'agents libres et n'accepte pas d'offres. Il ne représente pas un gestionnaire humain actif.

| Mesure, toutes saisons | Avant | Après |
|---|---:|---:|
| Buts sur balles / présences | 18,20 % | 5,70 % |
| Points / équipe / match | 6,09 | 4,66 |
| Circuits / équipe / match | 1,31 | 1,41 |
| Moyenne au bâton | ,310 | ,319 |
| Présences totales / match | 63,10 | 55,80 |

Les points diminuent, tandis que les circuits restent présents. Le nombre de présences diminue de 11,6 %; ce n'est pas une mesure de durée réelle avec animations. Les variations de circuits et de moyenne au bâton ne démontrent pas un changement direct de leur formule, restée intacte.

| Saison | BB avant | BB après | Points avant | Points après |
|---|---:|---:|---:|---:|
| 1 | 17,39 % | 7,90 % | 7,49 | 6,49 |
| 5 | 17,84 % | 5,44 % | 5,80 | 4,40 |
| 10 | 18,55 % | 4,62 % | 5,30 | 4,10 |

Les compteurs de chaque saison ont été contrôlés : coups sûrs, retraits sur prises, buts sur balles, points et statistiques des lanceurs concordent. Les tests couvrent la décroissance du risque pour les 19 valeurs de contact + puissance et les dix valeurs de lancer, le comportement sous fatigue, l'intégration dans les événements réels, les sauvegardes en cours de match et les saisons complètes. Suite complète : 69 tests réussis.

Reproduction : `node scripts/balance-walks.mjs /chemin/absolu/dist/engine.js /tmp/walks.json`. Les deux résultats bruts sont dans ce dossier. Pour la référence avant, utiliser les modules JS du commit de référence dans un dossier ESM distinct.

## Règles historiques retrouvées

Sources consultées dans le dossier d'origine, sans les modifier :

- [player_logic.py, ancienne version](https://drive.google.com/file/d/1tn89rFYXq3uL9oXHrewxy05TAjJGg6lw/view), fonctions `_update_un_joueur` et `developer_joueurs`.
- [game_models.py](https://drive.google.com/file/d/1ByvS-y_N4DGdwMX-ggbr3Q6hydoapPX-/view), compteur `saisons_agent_libre` initialisé à zéro et chargé depuis la sauvegarde.
- [Ancienne logique de gestion](https://drive.google.com/file/d/1dugHreXZS9iNls5mw2OzIlOjEpX7Abh2/view), remise à zéro du compteur dans les chemins de libération consultés.
- [Brainstorming : Vieillissement, Progression et Régression](https://docs.google.com/document/d/1yU69pa_UkSypw0uLHjT8p4EwzQOunJVuT75D3_1lCVc/edit), proposition de meilleure progression avec beaucoup d'AB ou de balles jouées, sans coefficient final.
- [Documentation IA et progression](https://drive.google.com/file/d/1hBarro36aVxgpNBxfD6iKD1YbhoasGQ7/view) et [Mécaniques](https://drive.google.com/file/d/1sC3W0JTCqesEO6dKFyIYDtVMmx5wRj1z/view). Ces textes contiennent des exemples et formulations qui ne correspondent pas tous exactement au code. L'état programmé est distingué des intentions.

### Retraite générale : déjà présente dans la nouvelle version

Après le développement, tous les joueurs sont évalués : 2 % à 30 ans, 5 % à 31, 10 % à 32, 15 % à partir de 33. Ajouter 20 points de pourcentage si âge ≥ 28 et talent total < 28/50.

### Traitement supplémentaire des agents libres : absent de la nouvelle version

L'ancienne fonction traite ensuite les agents libres survivants :

1. Incrémente `saisons_agent_libre` au bilan annuel. Ce code ne mesure pas exactement une année complète sans contrat : être libre au moment du bilan suffit.
2. Dès que ce compteur atteint deux, retire un point à un attribut aléatoire, avec un plancher de 1.
3. Effectue un deuxième tirage de retraite : 15 points de pourcentage par saison comptée, plus 15 points à 27–29 ans ou 25 points à 30 ans et plus; plus 25 points si talent < 28, sinon 15 points si talent < 32. Plafond du deuxième tirage : 90 %.

Les deux tirages de retraite sont successifs : la probabilité combinée vaut `1 − (1 − générale) × (1 − agents libres)`, et non leur somme. Le plafond de 90 % porte sur le deuxième tirage, pas nécessairement sur le risque combiné. Exemple : joueur de 24 ans, talent 25/50, première saison comptée sans contrat : 40 % au deuxième tirage.

### Progression selon le temps de jeu

Le brainstorming propose explicitement d'avantager les joueurs qui jouent davantage. Dans le code Python consulté, le calcul commun sélectionne néanmoins les variations uniquement selon âge et forme de carrière, après un filtre global de 70 % par attribut. Il sauvegarde les statistiques de saison, mais ne les utilise pas pour pondérer le développement. Le 70 % est un droit au tirage, qui peut ensuite donner une baisse, zéro ou une hausse; ce n'est pas 70 % de chances de gagner un point.

L'ancien malus d'un point après deux saisons comme agent libre est donc confirmé, mais aucun coefficient final de progression selon les matchs joués n'a été trouvé dans les sources examinées. Un remplaçant sous contrat bénéficie du calcul commun. Rétablir les règles historiques des agents libres et définir un coefficient de participation constituent les prochains changements possibles; ils ne sont pas inclus dans la correction BB.
