export let lang='fr';try{lang=localStorage.getItem('slimball.lang')||'fr';}catch{}if(!['fr','en','es'].includes(lang))lang='fr';
export function setLang(l){lang=l;try{localStorage.setItem('slimball.lang',l);}catch{}}
const lines=`invalid_rotation|Choisissez de 2 à 4 joueurs différents de votre équipe.|Choose 2–4 different players from your team.|Elige de 2 a 4 jugadores distintos de tu equipo.
league|Vie de la ligue|League stories|Vida de la liga
prematch|Rapport d’avant-match|Pregame report|Informe previo
award_mvp|Joueur de l’année — MVP|Player of the year — MVP|Jugador del año — MVP
award_pitcher|Lanceur de l’année|Pitcher of the year|Lanzador del año
award_bat|Bâton d’or|Golden Bat|Bate de oro
award_glove|Gant d’or|Golden Glove|Guante de oro
award_rookie|Recrue de l’année|Rookie of the year|Novato del año
award_playoffs|MVP des séries|Playoff MVP|MVP de las eliminatorias
award_progress|Plus belle progression|Most improved player|Mayor progresión
prize_won|{name} reçoit le prix « {prize} ».|{name} wins “{prize}”.|{name} recibe el premio «{prize}».
tip_rest|{name} est à {energy}/100 d’énergie. Envisagez {replacement} au poste {pos}.|{name} has {energy}/100 energy. Consider {replacement} at {pos}.|{name} tiene {energy}/100 de energía. Considera a {replacement} en {pos}.
tip_ready|L’énergie des titulaires prévus est d’au moins {energy}/100.|Projected starters have at least {energy}/100 energy.|Los titulares previstos tienen al menos {energy}/100 de energía.
tip_pitcher|Lanceur adverse prévu : {name}, lancer {skill}/10 et énergie {energy}/100.|Projected opposing pitcher: {name}, throwing {skill}/10 and energy {energy}/100.|Lanzador rival previsto: {name}, lanzamiento {skill}/10 y energía {energy}/100.
news_hr|{name} frappe {value} circuits dans un match pour {team}.|{name} hits {value} home runs in one game for {team}.|{name} conecta {value} jonrones en un partido para {team}.
news_hits|{name} réussit {value} coups sûrs dans un match.|{name} collects {value} hits in one game.|{name} logra {value} hits en un partido.
news_pitch|{name} retire {value} adversaires sur des prises dans un match.|{name} strikes out {value} batters in one game.|{name} poncha a {value} bateadores en un partido.
news_return|Retrouvailles : {name} affronte son ancien club, {team}.|Reunion: {name} faces former club {team}.|Reencuentro: {name} se enfrenta a su antiguo club, {team}.
news_rookie|{name} atteint dix coups sûrs lors de sa première saison jouée dans la ligue.|{name} reaches ten hits in their first played league season.|{name} alcanza diez hits en su primera temporada jugada en la liga.
news_record|Record de saison battu : {name} atteint {value} en {stat}.|New season record: {name} reaches {value} in {stat}.|Récord de temporada: {name} alcanza {value} en {stat}.
news_rivalry|Duel serré entre {team} et {other} : {wins} victoires contre {losses} dans leurs dernières rencontres.|Close rivalry: {team} and {other} have split their recent games {wins}–{losses}.|Duelo igualado entre {team} y {other}: {wins} victorias contra {losses} en sus últimos encuentros.
npc_sign|{team} recrute {name}.|{team} signs {name}.|{team} ficha a {name}.
npc_release|{team} libère {name}.|{team} releases {name}.|{team} libera a {name}.
npc_trade|{team} échange {name} contre {player} de {other}.|{team} trades {name} for {player} from {other}.|{team} intercambia a {name} por {player} de {other}.
saving|Sauvegarde en cours…|Saving…|Guardando…
dashboard|Tableau de bord|Dashboard|Panel principal
team|Gestion équipe|Team management|Gestión del equipo
calendar|Calendrier|Calendar|Calendario
standings|Classement|Standings|Clasificación
leaders|Stats ligue|League stats|Estadísticas
free|Agents libres|Free agents|Agentes libres
trades|Échanges|Trades|Intercambios
archives|Archives|Archives|Archivo
rules|Règles & tutoriel|Rules & tutorial|Reglas y tutorial
saves|Sauvegardes|Saved games|Partidas guardadas
quit|Sauvegarder et quitter|Save and quit|Guardar y salir
new|Nouvelle partie|New game|Nueva partida
continue|Continuer|Continue|Continuar
load|Charger|Load|Cargar
save|Sauvegarder|Save|Guardar
export|Exporter la partie|Export game|Exportar partida
import|Importer une partie|Import game|Importar partida
delete|Supprimer|Delete|Eliminar
backup|Restaurer la sauvegarde précédente|Restore previous backup|Restaurar copia anterior
saved|Partie sauvegardée|Game saved|Partida guardada
save_failed|Sauvegarde locale impossible. Exportez votre partie pour la conserver.|Local save failed. Export your game to keep it.|No se pudo guardar. Exporta la partida para conservarla.
local_note|Les sauvegardes restent dans ce navigateur. Exportez une copie pour changer d’appareil.|Saves stay in this browser. Export a copy to change devices.|Las partidas quedan en este navegador. Exporta para cambiar de dispositivo.
empty_saves|Aucune partie sauvegardée.|No saved games yet.|No hay partidas guardadas.
team_name|Nom de l’équipe|Team name|Nombre del equipo
manager_name|Nom du manager|Manager name|Nombre del mánager
mode|Mode de jeu|Game mode|Modo de juego
career|Carrière|Career|Carrera
free_mode|Ligue libre|Open league|Liga libre
career_desc|Remportez le championnat au plus tard en saison 10. Une réputation sous 20 en fin de saison met fin à la carrière.|Win the title by season 10. Reputation below 20 at season end ends your career.|Gana el título antes de terminar la temporada 10. La carrera termina si tu reputación baja de 20 al final de temporada.
free_desc|Construisez votre équipe et enchaînez les saisons sans limite.|Build your team across unlimited seasons.|Construye tu equipo a lo largo de temporadas ilimitadas.
start|Créer mon équipe|Create my team|Crear mi equipo
season|Saison|Season|Temporada
week|Semaine|Week|Semana
winter|Hiver|Winter|Invierno
spring|Printemps|Spring|Primavera
summer|Été|Summer|Verano
autumn|Automne|Autumn|Otoño
mon|Lundi|Monday|Lunes
wed|Mercredi|Wednesday|Miércoles
weekend|Weekend|Weekend|Fin de semana
back|Retour|Back|Volver
close|Fermer|Close|Cerrar
cancel|Annuler|Cancel|Cancelar
confirm|Confirmer|Confirm|Confirmar
home|À domicile|Home|Local
away|À l’extérieur|Away|Visitante
next_match|Match du jour|Today's game|Partido de hoy
watch|Voir la partie|Watch game|Ver partido
simulate|Simuler mon match|Simulate my game|Simular mi partido
next_day|Jour suivant|Next day|Día siguiente
sim_month|Simuler la période|Simulate period|Simular período
rest|Jour de repos|Rest day|Día de descanso
finished|Match terminé|Final score|Partido terminado
summary|Résumé du match|Game summary|Resumen del partido
details|Détails des actions|Play-by-play details|Detalle de jugadas
play|Lecture automatique|Auto play|Reproducción automática
pause|Pause|Pause|Pausa
step|Action suivante|Next play|Siguiente jugada
finish|Terminer le match|Finish game|Terminar partido
replay|Revoir le match|Replay game|Repetir partido
inning|Manche|Inning|Entrada
upper|Haut|Top|Alta
lower|Bas|Bottom|Baja
outs|Retraits|Outs|Eliminados
batter|Au bâton|At bat|Al bate
pitcher|Lanceur|Pitcher|Lanzador
bases|Coureurs sur les buts|Runners on base|Corredores en bases
highlights|Faits saillants|Highlights|Jugadas destacadas
no_highlights|Aucun point marqué pour le moment.|No runs scored yet.|Aún no hay carreras.
K|Retrait au bâton|Strikeout|Ponche
BB|But sur balles|Walk|Base por bolas
C|Retrait par attrapé|Catch out|Eliminado por atrapada
T|Retrait par relais|Throw out|Eliminado por tiro
E|Erreur défensive|Fielding error|Error defensivo
1B|Simple|Single|Sencillo
2B|Double|Double|Doble
3B|Triple|Triple|Triple
HR|Circuit|Home run|Jonrón
wins|Victoires|Wins|Victorias
losses|Défaites|Losses|Derrotas
points|Points|Points|Puntos
runs|Points marqués|Runs scored|Carreras anotadas
manager|Manager|Manager|Mánager
level|Niveau|Level|Nivel
reputation|Réputation|Reputation|Reputación
objectives|Objectifs actuels|Current objectives|Objetivos actuales
obj_champion|Remporter le championnat|Win the championship|Ganar el campeonato
obj_wins|Gagner 17 matchs|Win 17 games|Ganar 17 partidos
obj_top3|Avoir un joueur dans un top 3 en fin de saison|Have a top-3 player at season end|Tener un jugador entre los 3 mejores al final
progress|Progression|Development|Progresión
season_progress|Progression de la saison|Season progress|Progreso de temporada
trends|Derniers 10 matchs|Last 10 games|Últimos 10 partidos
journal|Journal des événements|Event log|Registro de eventos
offense|Offense|Offense|Ofensiva
defense|Défense|Defense|Defensa
pitching|Lanceurs|Pitching|Lanzadores
talent|Talent|Talent|Talento
name|Nom|Name|Nombre
age|Âge|Age|Edad
form|Forme de carrière|Career profile|Perfil de carrera
energy|Énergie|Energy|Energía
active|Actifs|Active|Activos
bench|Banc|Bench|Banquillo
auto_align|Aligner les meilleurs|Set best lineup|Alinear los mejores
auto|Alignement auto|Auto lineup|Alineación automática
auto_warning|L’alignement automatique remplacera vos choix avant chaque match.|Auto lineup will replace your choices before each game.|La alineación automática reemplazará tus elecciones antes de cada partido.
order|Ordre de frappe|Batting order|Orden de bateo
positions|Alignement défensif|Fielding lineup|Alineación defensiva
swap|Permuter|Swap|Intercambiar
swap_hint|Choisissez deux joueurs. Une permutation avec le banc remplace le joueur en défense et au bâton.|Choose two players. A bench swap replaces both fielding and batting slots.|Elige dos jugadores. Un cambio con el banquillo reemplaza ambas posiciones.
cut|Libérer le joueur|Release player|Liberar jugador
sign|Signer ce joueur|Sign player|Fichar jugador
choose_cut|Effectif complet : choisissez un joueur à libérer.|Roster full: choose a player to release.|Plantilla completa: elige un jugador para liberar.
profile|Fiche joueur|Player profile|Ficha del jugador
base|Base|Base|Base
effective|Effectif|Effective|Efectivo
fatigue|Malus de fatigue|Fatigue penalty|Penalización por fatiga
no_penalty|Aucun malus de fatigue|No fatigue penalty|Sin penalización
stats|Stats|Stats|Estadísticas
awards|Récompenses|Awards|Premios
no_awards|Aucune récompense pour le moment.|No awards yet.|Sin premios todavía.
no_history|Aucun historique pour le moment.|No history yet.|Sin historial todavía.
retired_title|Retraités|Retired players|Retirados
search|Rechercher un joueur|Search players|Buscar jugador
draft|Repêchage|Draft|Draft
rookies|Classe de recrues|Rookie class|Clase de novatos
round|Tour|Round|Ronda
pick|Choix|Pick|Elección
your_turn|À vous de choisir|Your pick|Tu elección
choose|Repêcher|Draft player|Seleccionar
simulate_pick|Simuler mon choix|Auto pick|Elección automática
simulate_draft|Simuler tout le repêchage|Simulate entire draft|Simular todo el draft
continue_draft|Continuer jusqu’à mon choix|Continue to my pick|Continuar hasta mi turno
draft_done|Le repêchage est terminé.|Draft complete.|Draft finalizado.
draft_required|Terminez le repêchage avant d’avancer.|Complete the draft before advancing.|Termina el draft antes de avanzar.
no_rookies|Les recrues seront dévoilées pendant l’intersaison.|Rookies are revealed in the offseason.|Los novatos se presentan durante la pretemporada.
season_report|Bilan de saison|Season report|Resumen de temporada
champion|Champion de la ligue|League champion|Campeón de liga
retirements|Départs à la retraite|Retirements|Retiradas
no_archives|Les archives apparaîtront à la fin de la première saison.|Archives appear after your first season.|El archivo aparecerá al terminar tu primera temporada.
archive_note|Archive en lecture seule|Read-only archive|Archivo de solo lectura
new_trade|Proposer un échange|Propose trade|Proponer intercambio
sent|Propositions envoyées|Sent proposals|Propuestas enviadas
received|Propositions reçues|Received proposals|Propuestas recibidas
trade_history|Historique des échanges|Trade history|Historial de intercambios
offered|Joueurs offerts|Players offered|Jugadores ofrecidos
asked|Joueurs demandés|Players requested|Jugadores solicitados
pay|Points offerts|Points offered|Puntos ofrecidos
receive|Points demandés|Points requested|Puntos solicitados
playoffs|Séries éliminatoires|Playoffs|Eliminatorias
offseason|Intersaison|Offseason|Entretemporada
offseason_required|Terminez les étapes de l’intersaison.|Complete the offseason steps.|Completa la entretemporada.
playoffs_required|Terminez les séries éliminatoires.|Finish the playoffs.|Termina las eliminatorias.
value|Valeur d’échange|Trade value|Valor de intercambio
send|Envoyer la proposition|Send proposal|Enviar propuesta
trade_delay|L’équipe répond après deux jours de jeu. Vous confirmez ensuite l’échange.|The team responds after two game days. You then confirm the trade.|El equipo responde tras dos días de juego. Después confirmas el intercambio.
accept|Accepter / finaliser|Accept / finalize|Aceptar / finalizar
refuse|Refuser / annuler|Decline / cancel|Rechazar / cancelar
pending|En attente|Pending|Pendiente
accepted|Acceptée par l’IA|Accepted by AI|Aceptada por IA
rejected|Refusée par l’IA|Rejected by AI|Rechazada por IA
refused|Annulée ou refusée|Cancelled or declined|Cancelada o rechazada
countered|Contre-proposition envoyée|Counteroffer sent|Contraoferta enviada
completed|Échange effectué|Trade completed|Intercambio completado
expired|Expirée|Expired|Caducada
stale|Effectif modifié|Roster changed|Plantilla modificada
counter|Contre-proposition|Counteroffer|Contraoferta
no_trades|Aucune proposition dans cette section.|No proposals in this section.|No hay propuestas en esta sección.
request_offer|Solliciter une proposition IA|Request an AI offer|Solicitar oferta IA
won|Vous êtes champion !|You are the champion!|¡Eres campeón!
lost|Fin du défi : saison 10 terminée.|Challenge ended: season 10 completed.|Fin del desafío: temporada 10 terminada.
dismissed|Fin de carrière : réputation insuffisante.|Career ended: insufficient reputation.|Fin de carrera: reputación insuficiente.
continue_free|Continuer en ligue libre|Continue in open league|Continuar en liga libre
normal|Normal|Normal|Normal
weak|Progression limitée|Limited growth|Progresión limitada
veteran|Longévité|Longevity|Longevidad
flash|Éclair|Flash|Fugaz
young|Jeune Étoile|Young Star|Estrella joven
steady|Régulier|Steady|Constante
late|Tardif|Late Bloomer|Tardío
avg|Moyenne au bâton|Batting average|Promedio de bateo
hr|Circuits|Home runs|Jonrones
rbi|Points produits|Runs batted in|Carreras impulsadas
def|Efficacité défensive|Fielding percentage|Eficacia defensiva
soPct|Retraits au bâton (%)|Strikeouts (%)|Ponches (%)
ab|Présences au bâton|At bats|Turnos al bate
hits|Coups sûrs|Hits|Hits
singles|Simples|Singles|Sencillos
doubles|Doubles|Doubles|Dobles
triples|Triples|Triples|Triples
bb|Buts sur balles|Walks|Bases por bolas
so|Retraits au bâton|Strikeouts|Ponches
fieldingChances|Occasions défensives|Fielding chances|Oportunidades defensivas
balls|Balles jouées|Balls fielded|Bolas jugadas
catchOuts|Retraits par attrapé|Catch outs|Eliminados por atrapada
throwOuts|Retraits par relais|Throw outs|Eliminados por tiro
errors|Erreurs|Errors|Errores
bf|Frappeurs affrontés|Batters faced|Bateadores enfrentados
pitchSO|Retraits au bâton lancés|Pitcher strikeouts|Ponches lanzados
pitchBB|Buts sur balles accordés|Walks allowed|Bases por bolas permitidas
allowed|Points encaissés|Runs allowed|Carreras permitidas
earned|Points mérités|Earned runs|Carreras limpias
hitsAllowed|Coups sûrs accordés|Hits allowed|Hits permitidos
pitchOuts|Retraits lancés|Pitching outs|Eliminados lanzados
era|ERA|ERA|ERA
whip|WHIP|WHIP|WHIP
invalid_save|Sauvegarde invalide ou incompatible.|Invalid or incompatible save.|Partida inválida o incompatible.
file_large|Ce fichier dépasse la limite de 30 Mo.|File exceeds 30 MB.|El archivo supera 30 MB.
match_running|Terminez le match en cours avant de modifier l’équipe ou le calendrier.|Finish the current game before changing the team or calendar.|Termina el partido antes de cambiar el equipo o calendario.
career_ended|La carrière est terminée. Vous pouvez continuer en ligue libre.|Career ended. You can continue in open league.|Carrera terminada. Puedes continuar en liga libre.
minimum_six|Il faut conserver au moins six joueurs.|Keep at least six players.|Conserva al menos seis jugadores.
invalid_player|Ce joueur n’est pas disponible.|Player unavailable.|Jugador no disponible.
invalid_trade|Cette proposition n’est pas valide.|Invalid trade proposal.|Propuesta inválida.
trade_stale|Un joueur a changé d’équipe. L’échange ne peut plus être effectué.|A player changed teams. This trade is no longer valid.|Un jugador cambió de equipo. El intercambio ya no es válido.
invalid_points|Les points doivent être un nombre entier positif ou nul.|Points must be a nonnegative integer.|Los puntos deben ser un entero no negativo.
not_enough_points|Vous n’avez pas assez de points.|Not enough points.|No tienes suficientes puntos.
trade_roster|Les deux équipes doivent conserver entre six et huit joueurs.|Both teams must retain six to eight players.|Ambos equipos deben conservar entre seis y ocho jugadores.
play_first|Jouez ou simulez votre match du jour avant d’avancer.|Play or simulate today's game before advancing.|Juega o simula el partido de hoy antes de avanzar.
match_unavailable|Ce match n’est pas disponible.|Game unavailable.|Partido no disponible.
roster_short|L’équipe doit avoir six joueurs disponibles.|Team needs six available players.|Se necesitan seis jugadores disponibles.
welcome|Votre équipe est prête. Préparez votre premier repêchage.|Your team is ready. Prepare your first draft.|Tu equipo está listo. Prepara tu primer draft.
lineup_changed|Alignement modifié.|Lineup updated.|Alineación actualizada.
signed|{name} rejoint votre équipe.|{name} joins your team.|{name} se une a tu equipo.
joined|Rejoint {team}.|Joined {team}.|Se unió a {team}.
released|{name} quitte {team}.|{name} leaves {team}.|{name} deja {team}.
drafted|{team} repêche {name}.|{team} drafts {name}.|{team} selecciona a {name}.
traded|Échangé vers {team}.|Traded to {team}.|Intercambiado a {team}.
retired_free|{name} : retraite à {age} ans après {seasons} bilans comme agent libre.|{name}: retired at {age} after {seasons} free-agent year-end reviews.|{name}: retirada a los {age} años tras {seasons} cierres de temporada como agente libre.
free_decline|Sans contrat depuis {seasons} bilans : −1 en {stat}.|Unsigned for {seasons} year-end reviews: −1 {stat}.|Sin contrato durante {seasons} cierres: −1 en {stat}.
development_activity|Temps de jeu : {factor} % des chances de gain conservées; déclin lié à l’âge inchangé.|Playing time: {factor}% of growth chances retained; age decline unchanged.|Participación: se conserva el {factor}% de las opciones de mejora; declive por edad sin cambios.
retired|Retraite à {age} ans.|Retired at age {age}.|Retirado a los {age} años.
birthday|{name} fête ses {age} ans.|{name} turns {age}.|{name} cumple {age} años.
match_result|{away} {a} — {h} {home}|{away} {a} — {h} {home}|{away} {a} — {h} {home}
season_done|Fin de saison : {name} remporte le championnat.|Season ended: {name} wins the title.|Fin de temporada: {name} gana el título.
objective_done|Objectif complété : {type}.|Objective completed: {type}.|Objetivo completado: {type}.
trade_sent|Proposition envoyée à {team}.|Proposal sent to {team}.|Propuesta enviada a {team}.
trade_answer|{team} accepte votre proposition. Confirmez pour finaliser.|{team} accepts. Confirm to finalize.|{team} acepta. Confirma para finalizar.
trade_counter|{team} fait une contre-proposition.|{team} makes a counteroffer.|{team} hace una contraoferta.
trade_rejected|{team} refuse votre proposition.|{team} declines your proposal.|{team} rechaza la propuesta.
trade_received|Nouvelle proposition de {team}.|New proposal from {team}.|Nueva propuesta de {team}.
trade_completed|Échange effectué avec {team}.|Trade completed with {team}.|Intercambio completado con {team}.
all|Tous|All|Todos
no_results|Aucun résultat.|No results.|Sin resultados.
read_only|Consultation|View only|Solo lectura
settings|Préférences|Preferences|Preferencias
sound|Sons de match|Game sounds|Sonidos de partido
motion|Animations|Animations|Animaciones
loading|Simulation en cours…|Simulating…|Simulando…
confirm_delete|Supprimer cette sauvegarde ? Cette action est définitive.|Delete this save? This cannot be undone.|¿Eliminar esta partida? No se puede deshacer.
confirm_cut|Libérer ce joueur ? Il rejoindra les agents libres.|Release this player to free agency?|¿Liberar a este jugador al mercado?
confirm_month|Simuler jusqu’à la fin de la période avec les alignements actuels ?|Simulate to period end with current lineup settings?|¿Simular hasta el final del período con la alineación actual?
confirm_draft|Laisser l’IA choisir les recrues et libérer les joueurs nécessaires ?|Let AI draft rookies and release players when needed?|¿Permitir que la IA seleccione novatos y libere jugadores?
qualification|Minimum : 10 présences, balles jouées ou frappeurs affrontés selon la catégorie.|Minimum: 10 at bats, balls fielded or batters faced for rate categories.|Mínimo: 10 turnos, bolas jugadas o bateadores enfrentados para porcentajes.`;
export const catalog=Object.fromEntries(lines.split('\n').map(l=>{let[k,...v]=l.split('|');return[k,v];}));
export function t(key,args={}){let text=catalog[key]?.[['fr','en','es'].indexOf(lang)]||key;return text.replace(/\{(\w+)\}/g,(_,k)=>args[k]??'');}
export function formName(f){return t(({Normal:'normal',Faible:'weak','Vétéran':'veteran','Éclair':'flash','Jeune Étoile':'young','Régulier':'steady',Tardif:'late'})[f]||'normal');}
export const periods=()=>['spring','summer','autumn','winter'].map(t);
