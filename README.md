# Slimball Manager — Club rétro

[Jouer à Slimball Manager](https://slimball-manager-club-retro.docile-hero-2836.chatgpt.site) — accès public.

Jeu de gestion de Slimball pour le navigateur, en solo ou en multijoueur avec un hôte. Interface française, anglaise et espagnole. Le solo fonctionne localement; le multijoueur utilise le relais de connexion hébergé. Les sauvegardes multijoueurs restent chez l’hôte.

## Finition 1.22.1

- Les réponses d’un ancien salon sont ignorées après fermeture ou changement de session.
- Le relais refuse atomiquement les publications dépassées ou contradictoires; leurs commandes restent en attente. Une publication identique peut être répétée après une coupure.
- Les actualisations préservent chaque place de la rotation, le champ sélectionné, les formulaires, les panneaux ouverts et le défilement des tableaux.
- Le suivi de sauvegarde de l’hôte affiche les opérations en cours et les échecs, et participe à la protection avant fermeture.
- Les règles de jeu, l’équilibrage et le fonctionnement de « Simuler une période » sont conservés.

Audit détaillé : `reports/stability-1.22.1.md`.

## Jouer

Créer une partie, terminer le repêchage, composer la défense et l’ordre de frappe, jouer ou simuler les matchs puis avancer le calendrier. Le tutoriel intégré explique les systèmes. Le mode carrière vise un titre en dix saisons ; la ligue libre permet de continuer sans cette échéance.

Les sauvegardes sont automatiques dans IndexedDB, avec une copie de la sauvegarde précédente. Le menu Sauvegardes permet de charger, restaurer, supprimer, exporter et importer. Une sauvegarde comprend le générateur aléatoire et le match en cours : recharger reprend exactement la simulation. Les sauvegardes de l’ancien jeu ne sont pas compatibles. Les fichiers exportés permettent de changer de navigateur ou d’appareil. La navigation privée ou l’effacement des données du site peut supprimer les sauvegardes locales.

## Systèmes présents

- Six équipes, effectifs de six à huit, six positions, ordre de frappe, banc, alignement manuel ou automatique.
- 33 matchs par équipe en onze séries ; quatre périodes et 48 jours par année.
- Six manches, prolongations, victoire immédiate à domicile, actions détaillées, fatigue, erreurs et bases forcées.
- Match pas à pas, lecture automatique réglable, petites animations et sons facultatifs. Rediffusion du dernier match du joueur ; autres résultats et archives avec scores par manche et cinq faits saillants au maximum.
- Fiches individuelles, statistiques offensives/défensives/lanceurs, classements et tops 10, contrôle des compteurs.
- Repêchage initial interactif en huit rondes; repêchage annuel de deux tours, 24 recrues, agents libres, signatures, libérations et permutations.
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

Création d’une partie : les six équipes sont vides. 60 joueurs de 21 à 30 ans sont générés. Probabilités de talent A+/A/B+/B/C/D : 2/5/13/50/20/10 %, pour des totaux respectifs de 40/35/30/25/20/15 répartis aléatoirement entre cinq attributs plafonnés à 10. Un ordre de repêchage est tiré au hasard puis inversé chaque ronde, pendant huit rondes (48 choix). Le joueur sélectionne ses huit joueurs; les NPC évaluent la couverture des six positions et le talent pour répondre aux besoins de leur effectif. Les 12 joueurs restants deviennent agents libres. Les six titulaires et l’ordre de frappe sont assignés automatiquement, puis Gestion équipe s’ouvre pour les ajustements. Aucun repêchage de recrues supplémentaire n’est lancé en saison 1. Les saisons suivantes conservent leurs deux tours annuels avec 24 recrues de 18 à 23 ans, dans l’ordre inverse du classement. Les sauvegardes existantes conservent leurs effectifs et leur repêchage en cours.

## Logos d’équipe

Les dix mascottes approuvées sont disponibles à la création de partie, avec leurs palettes de trois couleurs. Le logo choisi est réservé au joueur ; cinq autres sont distribués aux adversaires sans doublons. Une graine séparée attribue ces identités sans changer la génération des joueurs ou la simulation sportive. Chaque mascotte porte désormais un nom par défaut fixe. Choisir un logo préremplit le nom de l’équipe, qui reste modifiable. Les NPC reçoivent ensemble le nom, le logo et la tenue.

L’identité figure dans l’en-tête, la gestion d’équipe, les classements, le repêchage et les écrans de match. Les sauvegardes et les archives la conservent. Les anciennes sauvegardes reçoivent automatiquement des identités stables au chargement, sans recommencer la partie. Les sprites affichent les zones de la planche approuvée, sans les pastilles de présentation ; les palettes sont des éléments séparés de l’interface.


## Repêchage initial interactif — 12 septembre 2026

- Liste triable, portraits et fiches avec attributs, âge, potentiel et forme de carrière.
- Ordre de la ronde avec logos, effectifs dépliables et journal des sélections.
- Sélection NPC suivante, Aller à mon prochain choix, Choisir pour moi et Simuler le reste du repêchage.
- Sauvegarde après chaque action, reprise exacte du bassin, de l’ordre et des choix; contrôle des importations pendant les huit rondes.
- Validation automatisée : 26 tests, dont reprise à chacun des 48 choix, besoins des NPC, navigation vers Gestion équipe, compatibilité des anciens repêchages et dix saisons complètes. Rendu HTML et actions vérifiés dans un DOM minimal, sans recette navigateur visuelle.


## Portraits pilotes — v1.4

Six identités visuelles (trois hommes et trois femmes) sont attribuées une fois à la création. Le nom personnel reste issu du générateur de noms existant, indépendamment du modèle visuel. Le champ `portraitId` est sauvegardé et conservé dans les archives. Un tirage cosmétique distinct ne consomme pas le hasard sportif. Les mèches violettes ont un poids de 20 % parmi les personnages féminins, soit environ 10 % de la population. Avec ce petit bassin, les doublons sont attendus.

Le rendu SVG assemble les planches approuvées : visage inférieur invariant, haut de tête avec ou sans casquette et masque du chandail teinté dans la couleur principale. La tenue dépend de l’effectif consulté, pas d’une copie sur le joueur : sélection au repêchage, recrutement, libération et échange sont reflétés immédiatement. En rediffusion, les deux équipes du match déterminent les tenues, même après un échange. Les anciens portraits numériques restent présents pour la compatibilité des sauvegardes version 1; les fichiers importés reçoivent un identifiant permanent déterministe.

Les anciens noms personnalisés de l’équipe humaine sont préservés. Les NPC actifs reçoivent les noms des mascottes; les noms historiques dans les archives et journaux restent tels qu’enregistrés.

Validation : tests moteur/interface avec DOM minimal et rendu des 66 combinaisons (six personnes × dix équipes plus sans équipe) par le moteur SVG. Les traits centraux sont comparés pixel par pixel entre tenues. Aucun test sur navigateur réel, appareil mobile ou IndexedDB réel n’est revendiqué.

Pour refaire la planche de contrôle avec `sharp` disponible : `node scripts/verify-portraits.mjs /tmp/slimball-portraits.png`. Le script compare les traits centraux entre les onze tenues de chaque personne et produit la grille de contrôle.


## Bassin de 40 portraits — v1.5

Les six portraits pilotes restent inchangés. Trois planches de dix nouvelles personnes et une planche de quatre portent le bassin à 40 visages : 20 hommes et 20 femmes. Quatre personnes ont une mèche de couleur (violet, bleu, turquoise ou magenta), soit 10 % du bassin. Les prénoms et noms continuent à être générés indépendamment du modèle visuel.

À la création, un visage parmi les moins représentés du même genre est choisi avec le hasard cosmétique séparé. Les vingt modèles de chaque genre sont utilisés avant qu’un de ces modèles soit réutilisé dans la population actuelle. Les joueurs déjà sauvegardés conservent leur identifiant, leur nom et leur visage ; les nouvelles recrues peuvent recevoir les nouveaux modèles.

Les planches sont conservées comme images sources et découpées à l’affichage. Les casquettes utilisent les pixels approuvés, avec une échelle adaptée aux deux derniers lots. Le masque du chandail laisse le visage intact. Les ressources sont partagées entre portraits par le cache du navigateur.

Contrôles de cette version : 36 tests moteur/interface, dont sauvegardes existantes, répartition des modèles, repêchage, recrutement, échanges, rediffusions, glisser-déposer et dix saisons. Contrôle visuel des quatre lots avec les dix casquettes plus sans équipe, et comparaison des traits du visage au rendu SVG. Les vérifications d’interface utilisent un DOM minimal ; aucun nouveau test sur navigateur réel ou téléphone n’est revendiqué.


## Correction des contours des tenues — v1.5.1

Les captures de l’utilisateur ont révélé des raccords rectangulaires de fond, des coupes franches dans les cheveux et des zones de chandail oubliées ou débordantes. Les anciens tests de traits centraux ne couvraient pas ces défauts.

Les dix casquettes ont désormais des masques SVG suivant leur silhouette réelle, sans rectangle de fond ni morceaux du visage source sous la visière. Leur volume est ajusté aux coiffures en conservant la hauteur de la visière, avec une marge au-dessus du portrait pour éviter de couper le bouton. Les 40 chandails possèdent chacun un contour calculé depuis le dessin ; une couture ouverte du premier portrait blond est traitée séparément. Les PNG approuvés restent intacts. Les six premiers modèles utilisent leur dessin sans casquette comme base commune à toutes les tenues. Les identifiants, noms, effectifs et sauvegardes des joueurs restent conservés.

`node scripts/build-portrait-masks.mjs` reconstruit les géométries avec `sharp` (ou `SLIMBALL_SHARP_MODULE`). Le contrôle SVG vérifie maintenant les traits centraux, les coins du fond, les cheveux sur les côtés, le cou et la recoloration des deux manches dans les 440 combinaisons. Les 40 portraits sont également examinés en planches de huit, à 312 pixels par portrait. Les tests de navigateur réel ne sont pas revendiqués.


## Ajustement individuel des casquettes — v1.5.2

L'agrandissement global de la v1.5.1 couvrait les cheveux mais rendait les casquettes trop hautes. Chaque visage possède maintenant ses propres repères de largeur, position de visière et hauteur dans `dist/portrait-fit.js`. Les dix casquettes sont normalisées sur leur contour réel, indépendamment des différences entre les dessins sources. Les anciennes échelles par lot ont été retirées.

Les cheveux du sommet sont masqués lorsqu'une casquette est portée, au lieu d'agrandir la couronne pour les englober. Une silhouette SVG propre à chaque personnage laisse intactes les longueurs sur les côtés et détoure le fond sur un papier uniforme. Sans équipe, la coiffure complète reste visible. Les images sources, identifiants, noms, tenues et sauvegardes restent utilisables.

La vérification visuelle comprend les 40 portraits en grand format et les 400 tenues à 96 pixels, une planche par équipe (`scripts/review-portrait-fit.mjs`). Le contrôle des traits du visage tolère seulement 2 niveaux sur 255 pour l'anticrénelage des contours SVG dans librsvg ; un changement de position ou un pixel recouvert échoue au contrôle. Il ne remplace pas l'examen visuel de l'ajustement. Aucun essai dans un navigateur réel n'est revendiqué.


## Casquettes redessinées suivant la planche validée — v1.6.0

La planche corrigée a été validée : les casquettes suivent le crâne, pas le volume des cheveux. Trois formes de couronne et de visière ont été dessinées, avec un ajustement uniforme pour chaque visage. La largeur et la hauteur ne sont plus redimensionnées indépendamment. Les cheveux du sommet et des tempes sont adaptés sous la casquette ; la coiffure complète reste disponible sans équipe.

`cap-renderer.js` applique une seule échelle à l'ensemble couronne/visière. Les matériaux utilisent les couleurs de l'équipe ; l'emblème est une découpe du logo original transparent, sans génération ni déformation. Le même visage et le même chandail source restent utilisés pour les dix équipes. Les noms, portraits attribués, sauvegardes et règles du jeu sont conservés.

L'image originale des trois formes est stockée dans `dist/assets/portraits/cap-forms.png`. `scripts/build-cap-forms.mjs` en analyse les matériaux et génère uniquement des contours SVG ; il ne modifie pas les pixels de la source. `scripts/build-portrait-masks.mjs` prépare les contours des personnages. Les scripts utilisent facultativement Sharp via `SLIMBALL_SHARP_MODULE`. Les tests couvrent explicitement l'échelle uniforme, les repères de placement, le logo original et les agents libres. L'examen visuel se fait à 312 px et à la taille des vignettes ; les rendus SVG sont contrôlés pour les 440 combinaisons. Aucun test dans un navigateur réel n'est revendiqué.

## Mise à jour 1.7.0

- Navigation précédent/suivant sur les fiches ouvertes depuis une équipe, selon le tri et le filtre affichés; retour à la même liste.
- Valeur triable dans tous les tableaux de joueurs, classements et bilans. Les nouveaux bilans de match et historiques annuels enregistrent leur valeur à cette date; les anciennes entrées sans valeur affichent un tiret.
- Portraits visibles en défense NPC, forme de carrière explicitement nommée et échanges affichés du point de vue de leur expéditeur.
- Ancrage p31 recentré sur le crâne pour les dix casquettes, sans déformation.
- Proposition de 20 nouveaux portraits présentée séparément, non ajoutée au pool de 40.

## Mise à jour 1.8.0

- « Valeur d’échange » dans toutes les langues et toutes les vues utilisant cette donnée.
- Dix thèmes dérivés des identités des équipes; thème NPC pendant la consultation de son équipe et de ses fiches, retour au thème utilisateur dans les autres menus.
- Interludes de 2,6 secondes pour circuit/grand chelem, triple, prise d’avance et victoire, avec logo, score et bouton Continuer. Pause de lecture sans modification de la simulation; support direct et replay, option animations réduites.
- Animation double jeu prête pour un futur événement DP; le moteur actuel n’en simule pas, donc aucune fausse bannière.
- Tests de contraste, navigation des thèmes et pause/reprise d’un véritable circuit enregistré.

## Mise à jour 1.9.0 — Hiver et intersaison

- Calendrier annuel : printemps (repêchage), été, automne, puis séries hivernales. Les 99 matchs réguliers / 33 par équipe sont conservés.
- Quatre qualifiés : 1–4 et 2–3, demi-finales au meilleur de trois (jours 36/38/40), finale au meilleur de cinq (42–46). Le mieux classé reçoit les matchs impairs. Seuls les matchs nécessaires sont créés.
- Le classement régulier et les statistiques des joueurs sont préservés; compteurs de séries séparés, consultables dans les équipes, fiches et classements. Archives du tableau et des résultats.
- Jour 47 : cérémonie et récompenses. Actions explicites et sauvegardées pour progression/retraites, aperçu des recrues/recrutement, préparation, puis nouvelle saison et repêchage annuel inverse au classement régulier. Le titre de carrière dépend de la finale.
- Auto-alignement : exclut les joueurs moins reposés que le sixième; garde les spécialistes pertinents à énergie égale et répartit les postes par compétences. Même logique pour l’utilisateur et les NPC, sans écraser les alignements manuels.
- Migration : saison en cours non clôturée compatible immédiatement; une saison déjà archivée dans une ancienne sauvegarde conserve son résultat et passe au nouveau cycle l’année suivante.
- 50 tests : dix années complètes, reprise en plein match éliminatoire, archives invariantes, séries arrêtées à la victoire, contrôle des imports, rotation énergétique et toutes les étapes d’intersaison dans les trois langues.
- Référence relue : `slimball_manager_game_logic.py` du dossier Drive historique. L’ancien calendrier démarrait en hiver; le nouveau cycle déplace le départ au printemps afin de réserver l’hiver aux séries demandées.

### 1.10.0 — Recrutement et histoire
- Marché NPC tous les six jours de saison régulière et à l'étape de recrutement de l'intersaison : couverture des six postes, profondeur, âge, objectifs titre/reconstruction. Un mouvement par club et fenêtre; échanges de valeur comparable et utiles aux deux équipes. Les offres en cours réservent leurs joueurs. Aucun mouvement automatique du club utilisateur, aucun débit de points pour un échange NPC.
- Biographies narratives stables, débuts et clubs issus du journal réel, titres de carrière; records des saisons régulières terminées dans les archives. Aucun modificateur de personnalité.
- Banque de 60 portraits : 30 hommes, 30 femmes. Le nouveau lot comporte dix chevelures colorées ou à mèches; les identités déjà sauvegardées restent inchangées. Découpage SVG des planches approuvées, casquettes proportionnelles et masques de chandails adaptés aux nouveaux originaux foncés.

### 1.10.1 — Équilibrage sur plusieurs saisons
- Anniversaire du jour zéro traité une fois à la nouvelle saison, y compris pour les anciens calendriers.
- 24 recrues annuelles pour 12 choix; le repêchage initial et les classes déjà créées sont conservés.
- Priorité tournante entre NPC sur le marché des agents libres.
- Comparaison de 12 carrières de 10 saisons avant/après et prolongation de trois carrières à 25 saisons. Données et limites : [bilan d’équilibrage](reports/balance-summary.md). Script reproductible : `node scripts/balance-seasons.mjs 12 10 /tmp/balance.json`.

### 1.11.0 — Avant-match, vie de la ligue et trophées
- Rapport automatique avant de regarder ou simuler un match individuel : classement régulier, cinq derniers résultats, duels précédents, lanceur et frappeurs prévus, défense et conseils de repos. La prévision respecte l'alignement manuel et calcule les alignements automatiques sans mutation du jeu ni tirage aléatoire. Accès direct à la gestion d'équipe et retour au rapport. La simulation groupée de période reste une action groupée.
- Nouvelles narratives calculées sur les événements réels : matchs à plusieurs circuits, coups sûrs ou retraits sur prises, retours contre un ancien club, recrues atteignant dix coups sûrs et records de saison. Aucun effet sur les attributs ou le moral. Journal dédié et copie dans les archives; conservation des 300 dernières nouvelles.
- Cérémonie au début de l'intersaison, après les séries : MVP, lanceur, Bâton d'or, Gant d'or, recrue (dès la saison 2), MVP des séries et distinctions AVG/HR/RBI. Plus belle progression après l'étape de développement. Un gagnant par catégorie, cumul possible, aucune bonification d'attributs ni de points de gestionnaire. Critères, seuils et départages consultables dans la cérémonie. Les joueurs retraités de saisons antérieures ne sont pas candidats.
- Trophées conservés sur les fiches, dans les journaux individuels et dans les archives. Les anciennes distinctions restent consultables sans fabriquer de nouveaux prix rétroactifs. L'ajout du prix de progression complète uniquement les trophées de l'archive; ses statistiques de saison restent figées.

### 1.11.1 — Contrôle des buts sur balles

- Le test de but sur balles, effectué après le test de retrait sur prises, utilise maintenant `(12 − lancer effectif) / 40` : 27,5 % à 1/10, puis −2,5 points de pourcentage par niveau, jusqu'à 5 % à 10/10. Le risque par présence inclut aussi la probabilité de ne pas être retiré sur prises. La fatigue utilise les pénalités habituelles; aucun nouveau seuil n'est ajouté.
- Un seul tirage pour ce test; le détail des calculs affiche les poids effectivement utilisés. Le lancer réduit désormais le risque pour toutes les valeurs possibles de contact et puissance.
- Validation : 69 tests; comparaison de trois parties de dix saisons avant/après dans `reports/walks-before.json` et `reports/walks-after.json`. Voir `reports/walks-and-legacy-rules.md` pour les résultats et les règles historiques retrouvées. Retraite, développement et repêchage inchangés dans cette correction.

### 1.12.0 — Temps de jeu et carrière des agents libres

- Les hausses potentielles liées à l'âge et à la forme de carrière sont conservées avec une probabilité de `25 % + 75 % × min(matchs réguliers joués / 24, 1)`. Les baisses et le filtre global de 70 % par attribut restent inchangés. Les gains restent entiers. Aucun bonus de séries; les matchs joués pour un ancien club comptent. Sans anciens bilans individuels, une estimation conservatrice utilise les présences au bâton, explicitement signalée.
- Rétablissement du traitement historique des agents libres : compteur par bilan sans contrat, −1 à un attribut aléatoire dès le deuxième bilan (plancher 1), deuxième tirage de retraite après la retraite ordinaire. Risque supplémentaire = 15 points de pourcentage par bilan + 15 à 27–29 ans ou 25 dès 30 ans + 25 sous 28/50 de talent ou sinon 15 sous 32/50; plafond 90 % pour ce deuxième tirage.
- Signatures utilisateur/NPC, arrivées au repêchage et remplacements automatiques remettent le compteur à zéro; une libération commence une nouvelle période. Comme dans l'ancien code, être libre au bilan suffit à compter une saison, même après une libération récente.
- Compteurs absents des sauvegardes antérieures : départ à zéro, aucun rattrapage. Les phases d'intersaison déjà franchies ne sont pas rejouées. Les historiques restent consultables après une retraite; les bilans de progression incluent le déclin supplémentaire avant attribution du prix de progression.
- Fiches : participation et pourcentage de chances de gain conservées. Journaux : coefficient annuel, déclin sans contrat, motif de retraite. Règles FR/EN/ES mises à jour.
- Voir `reports/development-balance.md` et les deux résultats JSON pour la comparaison de 45 saisons avant et 45 après. Le repêchage et ses deux choix restent inchangés; cette version réintègre les règles des agents libres et la participation.


## Direction visuelle 02 — septembre 2026

- Interface bleu nuit, accents de club, pictogrammes de navigation et textes agrandis sur toutes les pages.
- Dix parcs locaux illustrés, un par identité d’équipe : village (Loups), montagnes (Faucons), blés (Bisons), port (Requins), rochers (Lynx), ateliers (Renards), prairies (Étalons), clairière (Hiboux), lac (Ours), vergers (Guêpes).
- Le parc est déterminé par le logo, sans modification de sauvegarde ni consommation du générateur aléatoire. Matchs et rediffusions montrent le parc de l’équipe qui reçoit.
- Gestion d’équipe : formation interactive sur le terrain, commandes de permutation conservées, banc, ordre de frappe et tableau complet toujours disponibles.
- Accueil, calendrier, briefing et page Ligue affichent les terrains. Fiches et matchs ajoutent des illustrations génériques d’actions ; les portraits réels restent les identifiants des joueurs.
- Les illustrations d’action sont des poses décoratives communes, et non de nouveaux portraits individualisés.
- Aucune modification du moteur sportif, des progressions, des récompenses ou du format des sauvegardes.
- Vérification : tests de rendu et d’interactions en FR/EN/ES, attribution des parcs à domicile/en rediffusion et préservation des six positions ; aucune recette dans un navigateur réel effectuée pour cette livraison.


### 1.14.0 — Joueurs personnalisés et terrain animé

- Six poses modulaires utilisent les vrais visages et casquettes, les couleurs du club et la carnation du portrait. Elles apparaissent sur l’accueil, les fiches et le terrain.
- Six défenseurs identifiés et cliquables occupent leurs positions. Les coureurs suivent les résultats réels, y compris les avances forcées et les circuits; la balle illustre la direction de l’action.
- Les animations représentent chaque présence au bâton, pas chaque lancer. Elles respectent la vitesse de lecture et le mode sans mouvement.
- Les alignements des matchs complets sont conservés pour leur rediffusion. Aucun changement aux probabilités ou aux règles sportives.
- Validation : 56 tests ciblés réussis (moteur, portraits, interface, présentation et déplacements); aucune recette dans un navigateur réel effectuée.


### 1.15.0 — Tableau de bord et suivi des échanges

- Trois joueurs distincts sélectionnés parmi tout l’effectif, sur les attributs de base : priorité Throw, puis Con + Pow, puis Catch + Speed. Affichage frappeur, lanceur, défenseur; poses contenues dans leur cadre.
- Commandes du calendrier dans le panneau du match. Simulation avec confirmation et mode d’alignement; score conservé sur le tableau de bord. Retours en haut à gauche.
- Étape de progression et retraites séparée de la cérémonie.
- Réponses aux échanges persistantes dans Envoyées et rappel sur le tableau de bord. Les nouvelles décisions enregistrent valeurs, impact sur l’effectif et motif, sans changer les règles de négociation ni les tirages.
- Évaluation existante : valeur = plancher(total des attributs × max(0,5; 1,5 − (âge − 21) × 0,05)). Le ratio inclut les points. Le score inclut ratio, qualité, lancer, talent total, gain d’effectif et aléatoire. Gain minimal −0,5; acceptation si score ≥70 ou ratio ≥1,2; sinon contre-offre si score ≥40 ou ratio ≥0,75; sinon refus.
- Offres spontanées : tentative à 8 % par jour avancé, avant l’hiver, maximum trois offres reçues actives; recherche d’un échange un contre un améliorant l’effectif NPC de plus de 0,5, avec compensation de valeur en points.
- Vérifications du moteur et de l’interface, dont sélection sans doublon, confirmation de simulation, réponses visibles et séparation des étapes.


### 1.15.1 — Statistiques d’alignement et raccord des visages

- Ordre de frappe et banc : Con, Pow, AVG et HR sur chaque joueur. Défense : Cat, Thr et Spe sur les cartes et le terrain. Les talents affichent les valeurs effectives; AVG et HR suivent la source statistique consultée.
- Visages dimensionnés selon la largeur mesurée de la tête et placés selon le cou, inclinaison adaptée à chaque pose, col au premier plan. Suppression du rendu pixelisé forcé des personnages.
- Vérification visuelle des six poses et 33 tests d’interface et de présentation des actions réussis.


### 1.16.0 — Championnat, dynastie et icônes

- Bannière de titre à la finale décisive, tous clubs, pause de lecture et confettis respectant les préférences de mouvement. Fermeture conservée dans la sauvegarde.
- Écran de carrière remportée et bilan consultable depuis les archives : victoires, défaites, saisons, titres, séries, joueurs marquants, records et palmarès. Totaux provenant des feuilles de match du club, incluant les séries et les joueurs partis; moyenne record admissible dès 30 AB. Les données anciennes incomplètes sont signalées.
- Icônes rétro dans les alignements, tableaux, fiches et bilans; icône RBI remplacée par un coureur au marbre. Illustrations générées intégrées localement, sans dépendance externe.
- 31 tests ciblés réussis, dont bilan sans doublons, attribution au club, anciennes données et annonce persistante en FR/EN/ES.

### 1.17.0 — Lisibilité et suivi des saisons

- Icônes sans légende intégrée, détourées par masques SVG transparents ; encadrés défensifs compacts.
- Attributs de début de saison enregistrés à la création et après les changements de chaque intersaison. Migration des sauvegardes à partir des historiques disponibles, sans inventer les saisons manquantes.
- Une seule colonne Talent ; valeur après fatigue indiquée seulement lorsqu’elle diffère.
- Masquage des anciennes casquettes et limitation du logo à sa zone de découpe.
- Classement ERA croissant, avec minimum de 10 manches lancées.
- Parc et logo de l’équipe qui reçoit le match du jour sur le dashboard.
- Ordre des deux tours affiché au repêchage annuel. Premier tri des talents du meilleur au moins bon et des attributs/valeurs du plus grand au plus petit.

## Multijoueur privé — v1.18.0

Le menu **Jouer en ligne** ouvre une ligue libre de six équipes, dont une à six humaines. L’hôte choisit son identité puis copie une invitation personnelle par place. Les invités choisissent parmi les logos encore disponibles. L’hôte verrouille les participants en lançant le repêchage : huit joueurs par club en serpentin, sans chronomètre. Les saisons suivantes gardent les équipes et le repêchage habituel de deux joueurs.

Le navigateur de l’hôte détient l’état officiel et sauvegarde toute la ligue dans IndexedDB. Les invités ne conservent qu’une clé d’accès locale et une vue temporaire de la partie. L’export de l’hôte contient les identités et les clés de reconnexion : il doit rester privé. Pour reprendre, l’hôte charge sa sauvegarde et transmet les nouvelles invitations aux mêmes participants. Il n’y a ni transfert d’hôte ni remplacement de joueur.

Chaque humain prépare son équipe et confirme séparément son match et sa disponibilité pour le lendemain. Les rencontres contre NPC sont indépendantes. Les rencontres entre humains démarrent après leurs deux confirmations ; le domicile commande lecture, vitesse et pas-à-pas, et le visiteur peut demander une pause. Jusqu’à trois matchs coexistent, chacun avec son générateur aléatoire sauvegardé. Les modifications d’effectif invalident la préparation. Un match est mis en pause après détection d’une déconnexion (jusqu’à dix secondes).

L’hôte ne peut avancer une journée ou une étape d’intersaison qu’après les confirmations nécessaires et la fin des matchs humains. Les rencontres NPC restantes sont alors simulées. Une délégation volontaire permet à l’IA de gérer une équipe absente. Simuler la période nécessite cependant le vote explicite de tous les humains, y compris ceux qui ont délégué. Un refus annule ; la simulation s’arrête au repêchage et à l’intersaison. Les échanges entre humains nécessitent l’acceptation du destinataire et sont revalidés lors de la transaction.

### Connexion et hébergement

`server/relay.js` est un relais HTTP compatible Cloudflare Workers. D1 contient seulement les messages, les présences et l’état temporaire compressé de la session ; aucune API de sauvegarde ou de restauration n’est exposée. Sans signe de vie de l’hôte pendant 60 secondes, le salon devient inaccessible ; ses lignes expirées sont purgées à la prochaine requête du relais. Les sauvegardes permanentes restent exclusivement chez l’hôte. Les clés sont aléatoires et stockées hachées par le relais. Une commande d’invité ne peut jamais publier un état ; l’identité de son auteur provient de sa clé, pas du contenu de la commande. Les commandes répétées sont dédupliquées.

La synchronisation utilise des requêtes périodiques (environ une seconde, 400 ms pour le spectateur d’un match) et des états gzip. Les actions 4× sont calculées à 250 ms côté hôte ; selon la connexion, plusieurs actions peuvent parvenir ensemble à un invité. Garder l’onglet de l’hôte ouvert et actif évite le ralentissement des minuteurs par le navigateur.

- Développement et relais local : `npm run dev` (Node 24).
- Tests : `npm test` ; génération du schéma : `npm run db:generate`.
- Construction Sites : `npm run build`, avec Worker dans `dist/server` et fichiers publics dans `dist/client`.
- GitHub Pages peut continuer à servir les fichiers frontaux de `dist/`. Le client utilise alors l’adresse de relais configurée dans `dist/online-config.js`.
- Le service doit être accessible aux invités. Une publication Sites réservée au propriétaire ne permet pas encore à ses amis de rejoindre : son accès doit être ouvert avant l’usage multijoueur externe.

Validation : tests du moteur solo et des écrans existants ; repêchage à six humains, trois matchs simultanés, contrôle à domicile, RNG indépendante entre matchs, reprise des matchs, échanges humains, déduplication, déconnexion, votes, saison complète et repêchage annuel. Essai réel du transport HTTP avec deux clients indépendants : état synchronisé et aucune sauvegarde côté invité. La recette visuelle dans un navigateur reste à faire.

### Passer un choix au repêchage annuel

En solo comme en multijoueur, **Passer mon tour** est disponible uniquement au tour du joueur pendant le repêchage entre les saisons. Chaque choix peut être passé séparément : passer les deux permet de ne recruter personne, sans libérer un joueur. L’historique et les sauvegardes conservent les tours passés. En multijoueur, l’hôte valide le tour et transmet le résultat aux autres participants. Le repêchage initial conserve ses 48 sélections obligatoires ; cette commande y est refusée par le moteur.

## Équilibrage de progression — 1.19.0

Les notes élevées sont plus difficiles à gagner et à conserver. Les gains multiples franchissent chaque seuil; les profils Tardif et Jeune Étoile sont recalibrés. Les notes de 10 à la génération deviennent exceptionnelles sans diminuer le budget de talent. Un déclin annuel supplémentaire de −1 s’applique selon la note, de 0 % à 5 ou moins à 25 % à 10, après le développement habituel. Les règles FR/EN/ES détaillent les probabilités et le résultat net des bilans.

Voir `reports/progression-release-1.19.md` pour les règles et validations. Aucune migration de sauvegarde n’est ajoutée.


## Version 1.19.1 — nouveaux parcs

Intégration des cinq illustrations validées : Ours, Requins, Renards, Hiboux et Lynx. Estrades plus garnies, poteaux de fausse balle alignés et identité propre à chaque équipe. Les repères des buts, du monticule et du marbre sont adaptés aux nouvelles images pour les joueurs et les animations. Les cinq autres parcs restent inchangés.


## Mise à jour 1.20.0 — Repêchage et fin de saison

- Repêchage : attributs seulement, prochain choix avec équipe/ronde, équipe consultable dès le départ, annonces des choix et protection contre les doubles clics (y compris les commandes multijoueur retardées).
- Infobulles sur les attributs, statistiques, valeur, talent et forme de carrière; wiki intégré en 17 rubriques avec recherche sans accents.
- Favoris personnels par partie et équipe, conservés dans ce navigateur, filtre et page regroupant tous les joueurs suivis.
- Les 24 recrues de la prochaine saison sont visibles dès l’automne et restent les mêmes jusqu’au draft.
- Nouveaux playoffs : repos au jour 36, demis aux jours 37–39 consécutifs, finale après un jour de repos suivant la dernière demi; repos entre les matchs 4 et 5. Les séries déjà commencées conservent leur calendrier.
- Deux étapes d’intersaison : cérémonie des trophées avec gagnant détaillé et podium, puis progression/retraites. La confirmation ouvre directement la saison et le draft suivants.
- Le banc affiche également THR/CAT/SPE. L’historique de repêchage montre ronde et choix global.
- Matchs : arrivée sur le score, actions plus lisibles, bannières pendant au moins six secondes et pauses synchronisées en ligne.

Validation : tests de simulation sur dix saisons, import/export, multijoueur, podiums, continuité des recrues et calendriers jusqu’au match 5; contrôles interactifs des favoris, infobulles et recherche.

## v1.21.0 — Rotation des lanceurs

- Gestion d’équipe : sélection ordonnée de 2 à 4 lanceurs, énergie, prochain tour et lanceur prévu. Rotation initiale de trois joueurs par THR pour les NPC et les anciennes sauvegardes.
- Alignement automatique : premier lanceur à au moins 60 d’énergie en partant du prochain tour. Si tous sont sous 60, priorité à l’énergie maximale, puis à l’ordre de rotation. Les autres lanceurs peuvent jouer en défense.
- Le tour avance une seule fois après le match, après le lanceur réellement utilisé. Prévisualisations et clics répétés ne consomment pas de tour. Sauvegardes, séries et changements de saison conservent la rotation; les départs sont remplacés automatiquement.
- Commande multijoueur contrôlée par équipe; édition verrouillée en match et confirmations de disponibilité annulées après modification. Wiki mis à jour en français, anglais et espagnol.

## Version 1.21.1 — les dix parcs avec spectateurs

- Nouveaux terrains des Loups, Faucons, Bisons, Étalons et Guêpes avec tribunes garnies.
- Versions validées : logos corrigés des Loups et des Bisons, poteaux de fausse balle repositionnés chez les Étalons.
- Repères de jeu ajustés aux cinq illustrations ; les sauvegardes et la rotation des lanceurs restent compatibles.

## Mise à jour du 19 septembre 2026

- Multijoueur : seul l’hôte demande une journée ou une période. Chaque participant reçoit une demande d’accord ; un refus annule l’action et affiche le nom du participant. Les statuts « prêt pour le lendemain » et l’avancement automatique sont supprimés. Tous les participants doivent être connectés ; les matchs non joués sont simulés après accord unanime. La préparation d’un match entre humains reste distincte.
- Gestion : deux préférences de poste par joueur, avec Banc possible au premier choix. L’alignement automatique conserve la fatigue puis la rotation prioritaires, optimise les préférences restantes et réduit la priorité des remplaçants à énergie égale.
- Rotation : choisir le prochain lanceur actualise immédiatement la défense, en conservant le seuil de fatigue.
- Intersaison : accès direct au tableau des trophées ; poursuite en haut de chaque étape.
- Fiches : progression annuelle colorée, efficacité défensive, ERA et pourcentage de retraits au bâton dans l’historique. Favoris regroupé avec les filtres et teinté de mauve lorsqu’il est actif.
- Portrait p03 : casquette recentrée et ajustée à la largeur du crâne.

## Retours visuels et sonores

Les clics, onglets, favoris, modifications de formation, changements de journée et refus disposent de retours courts. Circuits, grands chelems, victoires et trophées ont une célébration ponctuelle. Les actualisations multijoueurs inchangées ne redéclenchent pas ces effets. Sons et mouvements suivent les préférences existantes dans Sauvegardes → Réglages ; la réduction de mouvement du système est respectée. Aucun effet ne change les règles, le hasard sportif ou la durée des pauses de match existantes.


## Tutoriel solo — 1.23.0

- Case facultative « Activer le tutoriel » à la création d’une partie solo.
- Conseils contextuels du repêchage au premier match, puis à la découverte du recrutement, des échanges, de la progression et de l’entre-saison.
- Conseils non bloquants, élément concerné mis en évidence, réduction et reprise depuis Sauvegardes → Paramètres.
- Progression enregistrée dans la sauvegarde et conservée lors des exports/imports. Aucun tutoriel ni réglage associé en multijoueur.
- Validation : 66 tests d’interface, multijoueur et rotation; création réelle avec tutoriel et rendu du premier conseil vérifiés dans le navigateur.


## Candidat itch.io — 1.23.1-rc.1

- Les distributions itch.zone / itch.io et GitHub Pages utilisent le relais HTTPS configuré. Le Site et le développement local conservent leur API sur la même origine.
- Les invitations continuent à viser le document du jeu avec leur fragment personnel ; leur ouverture depuis itch.io reste à valider lors de la recette à deux joueurs.
- Produire le ZIP : `python3 scripts/package-itch.py` (Python 3.9+ et Node). Le script reconstruit le client, exclut le serveur, vérifie les limites et compare les octets de chaque fichier après compression. Le résultat est dans `releases/`, avec `index.html` à la racine.
- Sur itch.io, choisir HTML Game et téléverser ce ZIP comme jeu navigateur. Tester en plein écran, puis vérifier défilement, sauvegarde/reprise, export/import et connexion à deux. Ne pas annoncer le mobile avant recette dédiée.
- Le multijoueur dépend toujours du relais hébergé ; le ZIP ne contient pas de serveur. Garder ce service disponible.
- Cette version candidate ne constitue pas une validation navigateur de l’intégration itch.io.


## Candidat itch.io — 1.23.1-rc.2

Le panneau de session multijoueur apparaît après le contenu de la page pour les invités. Il reste en haut pour l’hôte. Les confirmations de passage du temps restent dans leur fenêtre habituelle.
