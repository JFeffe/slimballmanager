# Audit de stabilité et finition — 19 septembre 2026

Base : 0235cf9. Livraison applicative : 1.22.1. Le format de sauvegarde reste à 1.

## Résultats

- 157 tests automatisés réussis, zéro échec (150 existants et 7 nouveaux).
- Audit reproductible séparé : 10 saisons complètes, graine 191926, 71 rechargements avec égalité exacte de l’état. Les phases couvertes comprennent repêchage initial et annuel, match en cours, fin de saison régulière, séries, remise des prix et développement.
- Chaque saison compare la suite d’un match interrompu à la simulation du même état restauré. Vérification quotidienne des totaux statistiques.
- Après dix saisons : 300 joueurs conservés, 10 archives, 7 931 551 octets de JSON; estimation gzip/base64 de 813 784 octets. Sous les limites actuelles d’import et de transport pour cet échantillon. Ne démontre pas une capacité illimitée.
- Compilation du client et du relais réussie.

## Défauts corrigés

1. Réponse réseau retardée : un retour d’ancien salon pouvait encore affecter la session. Le client vérifie désormais la génération de session après la requête et après décompression.
2. Publication concurrente : le test de révision avant écriture laissait une fenêtre de course. La comparaison se fait désormais dans l’écriture SQL; la suppression des commandes acquittées dépend de l’état effectivement publié. Un test entrelace volontairement deux requêtes.
3. Rotation : quatre sélecteurs portant le même nom recevaient tous la dernière valeur restaurée. Les contrôles sont identifiés par formulaire, nom, type et occurrence. Le focus revient à la bonne place.
4. Actualisation de l’interface : les tableaux conservent leur défilement et les éditeurs dépliés restent ouverts sur le même écran.
5. Sauvegarde multijoueur : les sauvegardes de l’hôte alimentent maintenant le statut d’enregistrement, le statut d’échec et l’avertissement avant fermeture. Un test vérifie qu’un échec de sauvegarde est retenté avant publication et qu’une commande déjà appliquée ne s’exécute pas deux fois.
6. Les marqueurs temporaires de connexion, de sauvegarde et de lecture sont remis à zéro entre sessions; la liste des commandes rejetées reste bornée comme celle des commandes acceptées.

## Limites et suite

- Les tests de moteur ne remplacent pas une partie avec plusieurs personnes sur des réseaux réels. Le relais est testé avec SQLite local et le même code serveur, pas avec des coupures réseau réelles sur la production.
- L’inspection visuelle a couvert l’accueil, la création, le repêchage et sa confirmation. La suite a été interrompue par un blocage de politique du navigateur de test (`chrome-error://chromewebdata/`). La revue visuelle complète après corrections, sur téléphone et ordinateur, reste à effectuer; elle n’est pas déclarée réussie.
- Les 71 rechargements portent sur la sérialisation, la validation et la reprise de l’état. Ils ne constituent pas un test exhaustif d’IndexedDB, de quota disque ou de récupération de la copie de secours sur appareils réels.
- Les durées du fichier JSON incluent les assertions et validations dans le conteneur Node. Elles ne mesurent pas les performances d’un téléphone.
- Aucun changement de règles, probabilités, valeurs d’échange ou fonctionnement de « Simuler une période ». Pas de nouvelle mécanique de jeu dans cette passe.

Reproduire : `npm test`, puis `node scripts/audit-stability.mjs`. Mesures : `reports/stability-1.22.1.json`.
