# Design de Pwnpot

Ce document décrit le fonctionnement complet de la plateforme : le cycle de vie d'un CTF, où va l'argent, comment les litiges sont tranchés, et comment le design répond à chaque problème connu. Les choix faits par l'équipe sont résumés dans [Décisions actées](#décisions-actées).

## Sommaire

1. [Acteurs](#acteurs)
2. [Cycle de vie d'un CTF](#cycle-de-vie-dun-ctf)
3. [Flux d'argent](#flux-dargent)
4. [Score et classement](#score-et-classement)
5. [Litiges et appel](#litiges-et-appel)
6. [Problématiques et réponses](#problématiques-et-réponses)
7. [Paramètres](#paramètres)
8. [Interface du contrat (cible)](#interface-du-contrat-cible)
9. [Décisions actées](#décisions-actées)

---

## Acteurs

| Acteur | Description |
| --- | --- |
| **Organisateur** | Publie un CTF, fournit les factories des épreuves, dépose le cash prize et une caution |
| **Joueur** | Paie un ticket (un seul par adresse), exploite ses instances, soumet ses réussites, peut contester et voter |
| **Arbitre** | Contrat ERC-792 fixé au déploiement de `CTFPlatform` (`immutable`). `MockArbitrator` pour les tests et la démo, Kleros en extension |
| **N'importe qui** | Peut déclencher les transitions liées au temps (clôture, finalisation, application d'un timeout) : aucune étape ne dépend d'un acteur précis |

---

## Cycle de vie d'un CTF

```mermaid
stateDiagram-v2
    [*] --> Open : createCTF (cash prize + caution)
    Open --> Running : startTime atteint
    Running --> Contestation : endTime atteint
    Contestation --> Finalized : fenêtre écoulée sans litige
    Contestation --> Voting : openDispute (caution de contestation)
    Voting --> AppealWindow : fin du vote
    AppealWindow --> Appealed : appeal (frais d'appel)
    AppealWindow --> Finalized : sans appel, vote non (ou quorum raté)
    AppealWindow --> Cheated : sans appel, vote oui
    Appealed --> Finalized : arbitre non
    Appealed --> Cheated : arbitre oui
    Finalized --> [*]
    Cheated --> [*]
```

| Phase | Ce qui est possible | Qui déclenche la sortie |
| --- | --- | --- |
| `Open` | Acheter un ticket | Le temps (`startTime`) |
| `Running` | Acheter un ticket (jusqu'à `maxPlayers`), créer ses instances, soumettre ses réussites | Le temps (`endTime`) |
| `Contestation` | Ouvrir un litige | Le temps : n'importe qui appelle `finalize`. Sans litige, les gains sont retirables dès la fin de cette fenêtre |
| `Voting` | Voter (détenteurs de tickets, 1 adresse = 1 voix) | Le temps |
| `AppealWindow` | Faire appel | Le temps |
| `Appealed` | L'arbitre rend sa décision (`rule`) | L'arbitre, ou le timeout : sans réponse, le résultat du vote s'applique |
| `Finalized` / `Cheated` | Retirer ce qui est dû (`withdraw`) | — |

Toutes les transitions liées au temps sont **appelables par n'importe qui**. Si l'organisateur disparaît, le CTF se termine quand même.

**Durée maximale après `endTime`** : contestation 48 h + vote 48 h + appel 24 h + délai de l'arbitre 7 jours, soit **12 jours** dans le pire cas. Sans litige, tout est réglé 48 h après la fin.

---

## Flux d'argent

```mermaid
flowchart LR
    subgraph platform ["CTFPlatform"]
        pot[("Cagnotte")]
        bond[("Caution organisateur")]
        dbond[("Caution de contestation")]
    end
    org(["Organisateur"]) -->|"cash prize"| pot
    org -->|"caution"| bond
    players(["Joueurs"]) -->|"tickets"| pot
    contester(["Contestataire"]) -.->|"si litige"| dbond
    platform -->|"crédits internes, puis withdraw()"| out(["Bénéficiaires"])
```

L'argent ne sort **jamais** par un transfert automatique : chaque issue **crédite un solde interne** (`owed[address]`), puis chacun appelle `withdraw()` (*pull payment*).

| Issue | Gagnants | Joueurs | Organisateur | Contestataire |
| --- | --- | --- | --- | --- |
| **Fin normale, au moins une réussite** | Cash prize + tickets, répartis sur le podium | — | Récupère sa caution | — |
| **Personne n'a réussi** | — | Ticket remboursé | Récupère cash prize + caution | — |
| **Litige rejeté** | Comme une fin normale | — | Sa caution + la caution du contestataire | Perd sa caution |
| **Triche confirmée** | — | Ticket remboursé | **Perd sa caution** (brûlée) ; son **cash prize lui est rendu** | Caution rendue |

**Frais d'arbitrage (appel).** Celui qui fait appel avance les frais de l'arbitre. S'il gagne l'appel, ces frais lui sont **remboursés**, pris sur la caution du camp perdant : la caution de contestation si l'organisateur gagne, la caution de l'organisateur (avant le burn) si la triche est confirmée. Le remboursement est **plafonné** au montant de cette caution. S'il perd l'appel, ses frais sont perdus. C'est le modèle de Kleros.

Pourquoi la caution est **brûlée** plutôt que distribuée aux joueurs en cas de triche : si elle était partagée entre les votants, voter « triche » deviendrait rentable pour tous les perdants. Brûlée, elle punit l'organisateur sans créer d'incitation à mal voter.

Pourquoi le **cash prize est rendu** à l'organisateur en cas de triche : la caution brûlée suffit comme punition, puisqu'elle dépasse déjà ce qu'un tricheur peut gagner. Et si l'arbitre condamne à tort un organisateur honnête, la perte reste limitée à sa caution.

**Dimensionnement des cautions.**

- **Organisateur** : `caution ≥ cashPrize + maxPlayers × ticketPrice`. En trichant, un organisateur peut au mieux récupérer la cagnotte entière via un complice. Sa caution doit donc couvrir au moins ce gain.
- **Contestation** : `max(3 × ticketPrice, 0.001 ETH)`, toujours supérieure ou égale aux frais d'arbitrage.
- **Exemple** : 1 ETH de cash prize, 20 joueurs, ticket à 0.01 ETH → caution organisateur ≥ 1,2 ETH, caution de contestation 0.03 ETH.

**Le gas n'est jamais remboursé**, y compris en cas de triche confirmée.

---

## Score et classement

- Chaque épreuve réussie rapporte **1 point**. La réussite est horodatée (`block.timestamp`) au moment de `submit`.
- **Classement** : nombre de points décroissant, puis horodatage de la **dernière** réussite croissant. À score égal, la dernière réussite la plus tôt passe devant.
- **Même bloc** : à score et horodatage égaux, le premier enregistré garde sa place (comparaison stricte : on ne passe devant que si on est **strictement** meilleur).
- **Répartition** : le podium se partage **cash prize + tickets**, **60 / 30 / 10 %**. Avec 2 gagnants : **67 / 33 %**. Avec 1 gagnant : il prend tout. Les parts du 2e et du 3e sont calculées d'abord ; le reste (arrondis compris) va au 1er, pour qu'aucun wei ne reste bloqué.
- Le **top 3 est maintenu à chaque `submit`** (coût constant). Aucune boucle sur la liste des joueurs à la finalisation, donc aucun risque de dépasser la limite de gaz quand il y a beaucoup de joueurs.

---

## Litiges et appel

```mermaid
flowchart LR
    fin(["Fin du CTF"]) --> w{"Litige pendant<br/>la contestation ?"}
    w -->|"Non"| ok(["Finalisé"])
    w -->|"Oui"| vote["Vote des joueurs<br/>1 adresse = 1 voix"]
    vote --> ap{"Appel dans<br/>la fenêtre ?"}
    ap -->|"Non"| v{"Vote : triche ?<br/>(quorum raté = non)"}
    ap -->|"Oui"| arb["Arbitre ERC-792"]
    arb --> v2{"Décision : triche ?"}
    arb -.->|"timeout"| v
    v -->|"Non"| ok
    v -->|"Oui"| ko(["Triche confirmée"])
    v2 -->|"Non"| ok
    v2 -->|"Oui"| ko
```

1. **Ouverture** : pendant la fenêtre de contestation (48 h), un détenteur de ticket appelle `openDispute` et dépose la caution de contestation. Un seul litige par CTF.
2. **Vote** (48 h) : chaque détenteur de ticket vote « triche » ou « pas triche ». **1 adresse = 1 voix**, et chaque adresse ne peut détenir qu'un ticket. La triche est retenue si elle obtient **plus de 50 %** des voix exprimées **et** si le quorum est atteint : **max(3 votants, 20 % des tickets)**.
3. **Quorum non atteint** : le résultat est « pas de triche ». Le contestataire peut quand même faire appel.
4. **Appel** (24 h) : pendant la fenêtre d'appel, le camp perdant (l'organisateur, ou n'importe quel détenteur de ticket) peut appeler `appeal` et avancer les frais d'arbitrage. Le litige est alors transmis à l'arbitre (`IArbitrator.createDispute`). Les frais sont remboursés au gagnant de l'appel (voir [Flux d'argent](#flux-dargent)).
5. **Décision** : l'arbitre appelle `rule(disputeID, ruling)` sur `CTFPlatform` (interface `IArbitrable`). Sa décision est définitive.
6. **Timeout** : si l'arbitre ne répond pas dans les 7 jours, n'importe qui peut appliquer le résultat du vote.

**Pourquoi deux niveaux.** Les joueurs tranchent la plupart des cas gratuitement. Mais aucun des deux camps n'est neutre :

- les perdants ont intérêt à voter « triche » ;
- un organisateur tricheur peut inscrire des complices pour bloquer la sanction.

L'appel à un tiers sans intérêt dans la partie corrige ces deux biais, et son coût dissuade d'en abuser. C'est le modèle de Kleros et d'UMA.

**Pourquoi un ticket par adresse et un prix minimum.** Avec un vote par adresse, des tickets gratuits permettraient à un organisateur de créer autant d'adresses que nécessaire et d'acheter le vote pour rien. Le prix minimum (0.0001 ETH) donne un coût à chaque voix.

**Pourquoi pas un 50/50 joueurs / arbitre.** Avec une pondération moitié-moitié, l'arbitre décide seul : son vote suffit à faire basculer le résultat. Le vote des joueurs devient décoratif, tout en ajoutant du code.

---

## Problématiques et réponses

| # | Problème | Réponse | Où |
| --- | --- | --- | --- |
| 1 | L'organisateur part avec la cagnotte | Les fonds sont détenus par `CTFPlatform` et ne sortent que selon les règles | Contrat |
| 2 | Nous, les auteurs de la plateforme, changeons les règles ou gelons les fonds | Pas d'owner, pas de proxy, pas de pause, aucune fonction admin | Contrat |
| 3 | Prouver qu'un joueur a réussi sans flag | `validateInstance` lit l'état de **son** instance (« coffre vide », « owner == joueur ») | Factory |
| 4 | Un joueur casse l'épreuve pour les autres | Une instance par joueur et par épreuve (pattern factory, comme Ethernaut) | Factory + plateforme |
| 5 | Un joueur soumet à la place d'un autre (front-running) | `submit` ne valide que l'instance enregistrée pour `msg.sender` : soumettre à la place de quelqu'un n'a aucun effet | Plateforme |
| 6 | Copier un exploit vu on-chain | Possible et assumé : tout ce qui est on-chain est public. Le copieur arrive après, donc il est derrière au classement. Le podium réduit l'intérêt de copier sans le supprimer : un copieur rapide peut finir 2e ou 3e | Classement |
| 7 | L'organisateur publie une épreuve impossible pour garder la cagnotte | S'il n'y a aucune réussite, les tickets sont remboursés et l'organisateur ne gagne rien. Le code est vérifiable avant de payer | Règles de paiement |
| 8 | Factory truquée : elle refuse la validation à certains joueurs | Factories libres (seule option compatible avec « pas d'owner »). Le front affiche un badge « source vérifiée » / « non vérifiée » (API Basescan) et le `codehash` enregistré à la création. Litige en dernier recours | Plateforme + frontend + litige |
| 9 | Factory malveillante : gaz infini, réentrance, revert | `staticcall` avec limite de gaz pour la validation, `nonReentrant`, CEI. Au pire, seule cette épreuve est bloquée, jamais les fonds | Plateforme |
| 10 | L'organisateur fuite la solution à un complice | Pas prouvable on-chain. Dissuadé par la caution, contestable par litige. Limite assumée | Caution + litige |
| 11 | Un joueur conteste par frustration | La caution de contestation est perdue si le litige est rejeté, et versée à l'organisateur | Litige |
| 12 | Les perdants votent « triche » par intérêt | L'organisateur fait appel à l'arbitre, et ses frais lui sont remboursés s'il gagne | Appel |
| 13 | L'organisateur multiplie les adresses pour bloquer le vote (Sybil) | Un ticket par adresse, prix minimum de 0.0001 ETH : chaque voix coûte un ticket. Les joueurs peuvent faire appel | Vote + appel |
| 14 | L'arbitre ne répond jamais | Timeout de 7 jours : la décision du vote s'applique | Plateforme |
| 15 | L'arbitre est malhonnête | Il ne tranche que les fonds du litige. Choisi au déploiement et visible de tous | Contrat |
| 16 | L'organisateur disparaît en cours de route | Toutes les transitions liées au temps sont appelables par n'importe qui | Contrat |
| 17 | Réentrance sur les retraits | Pull payment, solde remis à zéro **avant** le `call`, `nonReentrant` | Contrat |
| 18 | Un destinataire qui refuse l'ETH bloque tout le monde | Pull payment : un retrait qui échoue ne bloque que ce retrait | Contrat |
| 19 | Trop de joueurs, la boucle de paiement dépasse le gaz | `maxPlayers` ≤ 200, top 3 maintenu à chaque `submit`, remboursements en pull : aucune boucle sur les joueurs | Contrat |
| 20 | ETH forcé dans le contrat (`selfdestruct`, envoi direct) | La comptabilité se fait sur des variables internes, jamais sur `address(this).balance` | Contrat |
| 21 | Le séquenceur décale `block.timestamp` | Seules des deadlines à l'échelle de l'heure en dépendent. Un écart de quelques secondes ne change rien d'important | Contrat |
| 22 | Une lecture juste après une écriture renvoie un état périmé (RPC) | Le frontend relit plusieurs fois après un reçu avant d'afficher un état | Frontend |
| 23 | Une clé de déploiement fuite | Keystore Hardhat chiffré, compte dédié au testnet, rien dans git | Process |

---

## Paramètres

| Paramètre | Fixé par | Valeur |
| --- | --- | --- |
| `cashPrize` | Organisateur | Libre, > 0 |
| `ticketPrice` | Organisateur | ≥ 0.0001 ETH (minimum imposé par la plateforme) |
| `maxPlayers` | Organisateur | 1 à 200 |
| `organizerBond` | Organisateur | ≥ `cashPrize + maxPlayers × ticketPrice` |
| `startTime`, `endTime` | Organisateur | Durée du CTF de 1 h à 30 jours |
| Tickets par adresse | Constante | 1 |
| Fenêtre de contestation | Constructeur (`immutable`) | 48 h |
| Durée du vote | Constructeur (`immutable`) | 48 h |
| Fenêtre d'appel | Constructeur (`immutable`) | 24 h |
| Timeout de l'arbitre | Constructeur (`immutable`) | 7 jours |
| Quorum | Constante | max(3 votants, 20 % des tickets) |
| Caution de contestation | Par CTF | max(3 × `ticketPrice`, 0.001 ETH), toujours ≥ frais d'arbitrage |
| Frais d'arbitrage (`MockArbitrator`) | Déployeur | Fixes, inférieurs à 0.001 ETH (le minimum de la caution de contestation) |
| Limite de gaz de `validateInstance` | Constante | 300 000 *(proposé)* |
| Arbitre | Déployeur | `immutable`, fixé au déploiement |

Les quatre durées du litige sont des **arguments du constructeur** stockés en `immutable` : elles sont fixées à vie pour un déploiement donné. Pour la démo, un déploiement séparé les réduit à quelques minutes.

---

## Interface du contrat (cible)

Interface indicative pour aligner frontend, tests et doc. Elle sera remplacée par le code réel.

```solidity
interface ICTFPlatform {
    // Organisateur
    function createCTF(CTFParams calldata p, address[] calldata factories) external payable returns (uint256 ctfId);

    // Joueur
    function buyTicket(uint256 ctfId) external payable;
    function createInstance(uint256 ctfId, uint256 levelIndex) external returns (address instance);
    function submit(uint256 ctfId, uint256 levelIndex) external;

    // Temps (n'importe qui)
    function finalize(uint256 ctfId) external;
    function applyVoteAfterTimeout(uint256 ctfId) external;

    // Litiges
    function openDispute(uint256 ctfId) external payable;
    function vote(uint256 ctfId, bool cheated) external;
    function appeal(uint256 ctfId) external payable;
    function rule(uint256 disputeID, uint256 ruling) external; // appelée par l'arbitre (IArbitrable)

    // Argent
    function withdraw() external;

    // Events : un par étape, lus par le frontend
    event CTFCreated(uint256 indexed ctfId, address indexed organizer);
    event TicketBought(uint256 indexed ctfId, address indexed player);
    event InstanceCreated(uint256 indexed ctfId, uint256 levelIndex, address indexed player, address instance);
    event LevelSolved(uint256 indexed ctfId, uint256 levelIndex, address indexed player, uint256 timestamp);
    event DisputeOpened(uint256 indexed ctfId, address indexed contester);
    event Voted(uint256 indexed ctfId, address indexed voter, bool cheated);
    event Appealed(uint256 indexed ctfId, uint256 disputeID);
    event Ruled(uint256 indexed ctfId, bool cheated);
    event Finalized(uint256 indexed ctfId, bool cheated);
    event Withdrawn(address indexed to, uint256 amount);
}
```

---

## Décisions actées

| # | Décision | Choix | Pourquoi |
| --- | --- | --- | --- |
| 1 | Répartition des gains | Podium **60 / 30 / 10 %** de (cash prize + tickets). Avec 2 gagnants : 67 / 33 %. Avec 1 : il prend tout. Parts du 2e et du 3e calculées d'abord, le reste (arrondis compris) va au 1er | Récompense plusieurs joueurs sans boucle sur la liste ; aucun wei bloqué par les arrondis |
| 2 | Cash prize si triche confirmée | **Rendu à l'organisateur** | La caution brûlée suffit comme punition : elle dépasse déjà ce qu'un tricheur peut gagner. Et c'est moins grave si l'arbitre condamne à tort un organisateur honnête |
| 3 | Gas | **Aucun remboursement** | Impossible à calculer proprement on-chain ; la complexité ne vaut pas le gain |
| 4 | Tickets | **Un seul ticket par adresse**, prix minimum **0.0001 ETH** | Sans prix minimum, voter ne coûte rien et un organisateur achète le vote avec des adresses gratuites |
| 5 | Factories | **Libres**. Le front affiche un badge « source vérifiée » / « non vérifiée » (API Basescan) et le `codehash` enregistré | C'est la seule option compatible avec « pas d'owner » : une liste blanche demanderait quelqu'un pour la tenir |
| 6 | Durées et quorum | Contestation **48 h** (sans litige, gains retirables à la fin de cette fenêtre), vote **48 h**, appel **24 h**, délai max de l'arbitre **7 jours** : 12 jours dans le pire cas. Arguments du constructeur en `immutable`. Quorum = **max(3 votants, 20 % des tickets)** ; quorum raté = « pas de triche », appelable par le contestataire. Organisateur : durée d'un CTF de 1 h à 30 jours, `maxPlayers` de 1 à 200 | Durées fixées à vie (pas d'admin), mais réductibles à quelques minutes pour la démo. Le plancher de 3 votants évite qu'une seule voix tranche un petit CTF |
| 7 | Points et égalités | **1 point** par épreuve réussie. À égalité, la dernière réussite la plus tôt (timestamp du bloc du `submit`) passe devant. Dans le même bloc, le premier enregistré garde sa place (comparaison stricte) | Règle simple, déterministe, calculable à chaque `submit` |
| 8 | Solde du Coffre | Géré par **la factory**, pas par `CTFPlatform`. L'organisateur alimente sa factory (`maxPlayers × 0.0001 ETH`) et récupère le reste après le CTF via une fonction de la factory. Ce que le joueur vide, il le garde | `CTFPlatform` reste générique et ne connaît pas le détail des épreuves |
| 9 | Frais d'arbitrage | **Remboursés au gagnant de l'appel** (modèle Kleros), pris sur la caution du camp perdant (contestataire, ou organisateur avant le burn), plafonnés au montant de cette caution. Les frais du `MockArbitrator` sont fixés sous le minimum de la caution de contestation | Un organisateur honnête n'a pas à payer pour être blanchi ; le plafond garantit que la plateforme ne paie jamais plus qu'elle ne détient |
| 10 | Cautions | Organisateur ≥ `cashPrize + maxPlayers × ticketPrice`. Contestation = `max(3 × ticketPrice, 0.001 ETH)`, toujours ≥ frais d'arbitrage. Ex. : 1 ETH de prize, 20 joueurs, ticket à 0.01 ETH → caution ≥ 1,2 ETH, contestation 0.03 ETH | La caution couvre le gain maximal d'une triche ; la contestation est assez chère pour dissuader l'abus et couvre toujours les frais d'appel |
