# Slimball Manager — Club rétro

[Jouer à Slimball Manager](https://slimball-manager-club-retro.docile-hero-2836.chatgpt.site) — accès privé actuel.

Jeu de gestion solo de Slimball, reconstruit pour le navigateur à partir du projet Python/Flask fourni. Interface française, anglaise et espagnole. Aucun compte ni serveur de jeu nécessaire. Les portraits sont des illustrations génériques provisoires.

## Jouer

Créer une partie, terminer le repêchage, composer la défense et l’ordre de frappe, jouer ou simuler les matchs puis avancer le calendrier. Le tutoriel intégré explique les systèmes. Le mode carrière vise un titre en dix saisons ; la ligue libre permet de continuer sans cette échéance.

Les sauvegardes sont automatiques dans IndexedDB, avec une copie de la sauvegarde précédente. Le menu Sauvegardes permet de charger, restaurer, supprimer, exporter et importer. Une sauvegarde comprend le générateur aléatoire et le match en cours : recharger reprend exactement la simulation. Les sauvegardes de l’ancien jeu ne sont pas compatibles. Les fichiers exportés permettent de changer de navigateur ou d’appareil. La navigation privée ou l’effacement des données du site peut supprimer les sauvegardes locales.

## Systèmes présents

- Six équipes, effectifs de six à huit, six positions, ordre de frappe, banc, alignement manuel ou automatique.
- 33 matchs par équipe en onze séries ; quatre périodes et 48 jours par année.
- Six manches, prolongations, victoire immédiate à domicile, actions détaillées, fatigue, erreurs et bases forcées.
- Match pas à pas, lecture automatique réglable, petites animations et sons facultatifs. Rediffusion du dernier match du joueur ; autres résultats et archives avec scores par manche et cinq faits saillants au maximum.
- Fiches individuelles, statistiques offensives/défensives/lanceurs, classements et tops 10, contrôle des compteurs.
- Repêchage de deux tours, 40 à 60 recrues, agents libres, signatures, libérations et permutations.
- Échanges multijoueurs avec points, réponse IA différée, contre-propositions, finalisation et historique.
- Anniversaires, sept profils de progression, retraites, récompenses, bilans et archives annuelles.
- Carrière : réputation, XP, niveaux, objectifs ; poursuite en ligue libre après le résultat.
- Interface responsive, navigation clavier, mouvement réduit, trois langues.

## Développement

Modules JavaScript natifs, HTML et CSS. Pas de dépendances de production, de compilation ou de CDN. Servir `dist/` par HTTP (les modules ne se chargent pas via `file://`). Exemple avec Python installé :

```sh
python3 -m http.server 8080 --directory dist
```

Tests sous Node.js 22 ou supérieur :

```sh
node --test tests/*.test.js
```

Les tests couvrent dix saisons consécutives, la reprise déterministe d’un match, les statistiques, les transactions d’échange, les effectifs, les importations invalides et le rendu des écrans. Les tests d’interface vérifient le HTML produit dans un environnement DOM minimal ; ils ne remplacent pas une recette visuelle et interactive dans un vrai navigateur. La persistance IndexedDB nécessite également un navigateur pour une recette d’intégration complète.

## GitHub Pages

Le dépôt est prêt pour GitHub. La configuration `.github/workflows/pages.yml` teste le moteur et publie directement `dist/` lors d’un push sur `main`. Dans les paramètres Pages du futur dépôt, sélectionner GitHub Actions comme source. L’application utilise des chemins relatifs et fonctionne donc aussi sous une URL de dépôt, sans domaine personnalisé.

Chaque personne joue sa propre partie solo. Le lien de jeu se partage ; les sauvegardes ne sont pas partagées automatiquement entre amis. Aucun accès GitHub utilisateur n’a été utilisé pour préparer ce projet.

## Sources et choix de reconstruction

Le code fourni (`app.py`, `game_models.py`, `game_constants.py`, `game_simulation.py`, `player_logic.py`, `slimball_manager_game_logic.py`, `game_view_data.py`) et les écrans/templates de l’ancien jeu ont servi de référence. Le moteur a été réécrit en JavaScript, et non embarqué avec Flask. Les noms, classes de talent, profils d’âge/progression et probabilités principales proviennent de ces sources.

Corrections délibérées :

- L’objectif de 50 victoires, inaccessible dans une saison de 33 matchs, devient 17 victoires.
- Les retraits au bâton comptent dans AB, les buts sur balles n’y comptent pas. Les déplacements sur un but sur balles respectent les bases forcées.
- Fin correcte des manches, prolongations et victoire immédiate à domicile. Pas de résultat nul arbitraire.
- Harmonisation des valeurs de côté de frappe Odd / Even / Switch ; conservation de l’alignement manuel lorsque l’automatisme est désactivé.
- Calendrier de séries organisé autour d’une rotation des adversaires, plutôt que de tirages pouvant déséquilibrer la fréquence des confrontations. Onze séries ne se répartissent pas parfaitement entre cinq adversaires.
- Répartition initiale du talent en serpentin pour des effectifs comparables. Le repêchage d’ouverture est disponible immédiatement.
- Réparation des effectifs après les retraites pour conserver au moins six joueurs ; finalisation des échanges atomique et revalidation des joueurs.
- La probabilité manquante du profil Tardif correspond à l’absence de changement, comme le repli du code historique.
- ERA conservée sur neuf manches, même si les matchs de Slimball durent six manches. Les points mérités utilisent les erreurs et retraits virtuels ; cette simulation n’est pas un système complet de marquage officiel de baseball.

Les fichiers de l’ancien projet et ses anciennes sauvegardes ne sont pas inclus. La diffusion publique du code et des noms du jeu reste à faire dans le dépôt GitHub choisi par son propriétaire ; aucune licence de redistribution n’a été inventée.

## Ajustements du 10 septembre 2026

- Confirmation du remplacement au repêchage et en recrutement réparée (champ nommé `id` masquant `form.id`).
- Gestion des positions, de l’ordre de frappe et du banc par glisser-déposer ; poignées utilisables au toucher ou par deux sélections au clavier. Les permutations manuelles désactivent l’alignement automatique.
- Bilan permanent de chaque nouveau match : points par manche, R/H/E, tableaux des frappeurs et lanceurs, identité des joueurs au moment du match. Les anciens résultats sans ces compteurs restent lisibles.
- Nom d’équipe et domicile/visiteur affichés pour le frappeur et le lanceur. Retour au tableau de bord avant le bouton de rediffusion.
- Budget de sauvegarde du test de dix saisons porté de 5 à 12 Mo pour conserver les statistiques individuelles de 990 matchs, sous la limite d’import de 30 Mo.

Création d’une partie : 60 joueurs de 21 à 30 ans sont générés. Probabilités de talent A+/A/B+/B/C/D : 2/5/13/50/20/10 %, pour des totaux respectifs de 40/35/30/25/20/15 répartis aléatoirement entre cinq attributs plafonnés à 10. Les joueurs sont triés par total puis répartis en huit tours alternés (équipes 0 à 5 puis 5 à 0) : 48 joueurs en équipes et 12 agents libres. Les six titulaires sont affectés selon les attributs utiles à chaque poste, et l’ordre de frappe selon Contact + Power. Le mode carrière utilise la même répartition que le mode libre. Un groupe distinct de 40 à 60 recrues de 18 à 23 ans est ensuite créé pour le repêchage d’ouverture. À égalité initiale, l’ordre du repêchage découle du tri des noms d’équipes, inversé.

## Logos d’équipe

Les dix mascottes approuvées sont disponibles à la création de partie, avec leurs palettes de trois couleurs. Le logo choisi est réservé au joueur ; cinq autres sont distribués aux adversaires sans doublons. Une graine séparée attribue ces identités sans changer la génération des joueurs ou la simulation sportive. Les noms d’équipes demeurent indépendants des mascottes.

L’identité figure dans l’en-tête, la gestion d’équipe, les classements, le repêchage et les écrans de match. Les sauvegardes et les archives la conservent. Les anciennes sauvegardes reçoivent automatiquement des identités stables au chargement, sans recommencer la partie. Les sprites affichent les zones de la planche approuvée, sans les pastilles de présentation ; les palettes sont des éléments séparés de l’interface.
