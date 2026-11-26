# Post-mortem : The DAO (2016)

The DAO est l'incident fondateur de la sécurité des smart contracts : un fonds d'investissement géré par un contrat, vidé d'environ un tiers de ses ETH par **réentrance**, la faille que Pwnpot enseigne dans sa première épreuve et dont `CTFPlatform` doit se protéger. Ce document résume l'incident à partir de ses sources, puis montre ce que Pwnpot fait différemment, avec le code et les tests correspondants.

## Sommaire

1. [Ce qui s'est passé](#ce-qui-sest-passé)
2. [La cause technique](#la-cause-technique)
3. [Les conséquences](#les-conséquences)
4. [Ce que Pwnpot fait différemment](#ce-que-pwnpot-fait-différemment)
5. [Ce que Pwnpot ne fait pas mieux](#ce-que-pwnpot-ne-fait-pas-mieux)
6. [Sources](#sources)

---

## Ce qui s'est passé

The DAO était un fonds d'investissement sans gestionnaire : les participants achetaient des tokens contre de l'ETH, puis votaient pour financer des projets. Un mécanisme de sortie, le **split**, permettait à un participant en désaccord de récupérer sa part dans une nouvelle DAO, la « child DAO », dont les fonds restaient bloqués 28 jours.

| Date | Événement |
| --- | --- |
| Avril-mai 2016 | Vente des tokens : environ 11,5 millions d'ETH levés, plus de 150 millions de dollars à l'époque, auprès de plus de 11 000 participants [1]. Certaines sources donnent 12,7 millions d'ETH [8]. |
| 17 juin 2016 | Un attaquant exploite une faille d'appel récursif dans la fonction de split. Environ **3,6 millions d'ETH**, près d'un tiers des fonds, partent vers sa child DAO [1][2]. Vitalik Buterin annonce l'attaque sur le blog de la Fondation Ethereum [2]. |
| 18 juin 2016 | Phil Daian (Cornell) publie l'analyse technique de l'exploit [3]. |
| 17 juin - 20 juillet 2016 | Le blocage de 28 jours de la child DAO laisse le temps de réagir : l'ETH volé ne peut pas encore sortir [1][6]. |
| 20 juillet 2016 | **Hard fork** au bloc 1 920 000 : un changement d'état irrégulier déplace environ 12 millions d'ETH des contrats de la DAO vers un contrat de remboursement (`WithdrawDAO`) [4]. La chaîne qui refuse ce fork continue sous le nom **Ethereum Classic** [1][4]. |
| 25 juillet 2017 | La SEC conclut que les tokens de The DAO étaient des titres financiers (Release No. 81207) [5]. |

Le montant volé valait **50 à 60 millions de dollars** à l'époque, selon les sources [1][7].

---

## La cause technique

D'après l'analyse de Phil Daian [3], la fonction de split **versait l'ETH avant de mettre à jour les soldes** du participant : les soldes et totaux n'étaient remis à jour qu'à la fin. Le versement passait par un appel externe vers un contrat contrôlé par le destinataire. L'attaquant a donc utilisé un contrat dont la fonction de repli (*fallback*) **rappelait le split** pendant le versement. Comme son solde n'avait pas encore été remis à zéro, la même part était comptée et versée encore et encore, dans la limite du gaz de la transaction.

Le motif, simplifié :

```solidity
// Schéma de la faille (pas le code de The DAO) : l'interaction avant l'effet.
function split() external {
    uint256 amount = balances[msg.sender];
    (bool ok, ) = msg.sender.call{value: amount}(""); // l'appelant reprend la main ici
    require(ok);
    balances[msg.sender] = 0; // trop tard : il a déjà rappelé split()
}
```

Deux aggravants, relevés par Daian [3] :

- **La réentrance traversait plusieurs fonctions.** Le chemin d'attaque passait par le versement des récompenses avant de revenir dans le split. Relire chaque fonction isolément ne suffisait pas.
- **L'équipe avait corrigé ce type de faille ailleurs.** L'attaquant visait une fonction similaire à celle qui venait d'être protégée.

---

## Les conséquences

- **Un hard fork.** The DAO n'avait aucun moyen de geler ou de corriger son code. La seule façon de rendre l'ETH a été de modifier l'état de toute la chaîne au bloc 1 920 000 [4], ce qui a coupé la communauté en deux : Ethereum d'un côté, Ethereum Classic de l'autre [1].
- **Un précédent réglementaire.** Un an plus tard, la SEC a qualifié les tokens de The DAO de titres financiers [5].
- **Une leçon d'ingénierie**, devenue standard : *checks-effects-interactions*, *pull payment* plutôt que *push*, garde contre la réentrance sur toutes les fonctions qui touchent aux fonds.

---

## Ce que Pwnpot fait différemment

Pwnpot est exposé au même risque, en pire sur un point : `CTFPlatform` détient l'argent de tous les CTF **et** appelle du code écrit par d'autres, les factories des organisateurs (voir [FAILURES.md](FAILURES.md#la-faille-la-plus-pertinente-pour-pwnpot)).

| Ce qui a cassé The DAO | Parade dans Pwnpot | Où le vérifier |
| --- | --- | --- |
| ETH versé **avant** la mise à jour du solde | `withdraw` remet `owed[msg.sender]` à zéro **avant** le `call` (*checks-effects-interactions*) | [`CTFPlatform.sol`](../contracts/contracts/CTFPlatform.sol), fonction `withdraw` ; test `test_MaliciousReceiver_Catching_GetsExactlyItsTicket` ([`CTFPlatformAttacks.t.sol`](../contracts/contracts/CTFPlatformAttacks.t.sol)) : un `receive()` qui rappelle `withdraw` est refusé, et il reçoit exactement son dû |
| Réentrance **d'une fonction à l'autre** | `nonReentrant` sur **toutes** les fonctions qui modifient l'état, pas seulement `withdraw` | Liste des points d'entrée dans [SECURITY.md](SECURITY.md#points-dentrée-qui-modifient-létat) ; tests `test_MaliciousFactory_SubmitFromCreateInstance_Reverts` et `test_MaliciousFactory_WithdrawFromCreateInstance_Reverts` : une factory qui rappelle `submit` ou `withdraw` pendant `createInstance` est refusée |
| Paiement **poussé** au milieu de la logique métier | *Pull payment* : chaque issue crédite un solde interne, seul `withdraw` envoie de l'ETH, et à l'appelant seulement | [DESIGN.md](DESIGN.md#flux-dargent), fonction `_credit` de `CTFPlatform.sol` ; test `test_Withdraw_RevertsWhenReceiverRejects_OthersUnaffected` |
| Code tiers appelé avec les fonds en jeu | Validation des factories en `staticcall`, limitée à 300 000 gaz : une factory ne peut ni écrire, ni rappeler la plateforme, ni consommer tout le gaz | Fonction `_validate` de `CTFPlatform.sol` ; [`CTFPlatformFactories.t.sol`](../contracts/contracts/CTFPlatformFactories.t.sol) (factory qui revert, réponse mal formée, écriture en validation) et `test_GasBombFactory_SubmitIsNotSolved_PlatformKeepsWorking` |
| Comptabilité fausse sans que personne ne le voie | Tests d'invariants : sur des suites d'actions aléatoires, le solde du contrat est toujours égal à ce qu'il doit, et `withdraw` ne verse jamais plus que `owed` | [`CTFPlatformInvariants.t.sol`](../contracts/contracts/CTFPlatformInvariants.t.sol) (`invariant_2_Conservation`, `invariant_6_BoundedWithdraw`) |
| Faille connue, mais pas cherchée partout | Slither lancé avant le déploiement, chaque alerte de réentrance triée et justifiée | [SECURITY.md](SECURITY.md#passe-de-sécurité-avant-déploiement) |

Et la faille elle-même est au programme : **l'épreuve 1, le Coffre, reproduit volontairement l'erreur de The DAO**. Son `withdraw` envoie l'ETH avant de remettre le solde à zéro, et le joueur doit la vider avec un contrat qui rappelle `withdraw` depuis son `receive()` :

- la faille : [`Vault.sol`](../contracts/contracts/levels/Vault.sol), fonction `withdraw` ;
- l'exploit : [`VaultAttack.sol`](../contracts/contracts/exploits/VaultAttack.sol) ;
- le test qui le rejoue : « drains the vault by reentrancy, validates and keeps the loot » dans [`Vault.ts`](../contracts/test/levels/Vault.ts) ;
- l'explication : [CHALLENGES.md](CHALLENGES.md#épreuve-1--coffre-réentrance).

---

## Ce que Pwnpot ne fait pas mieux

- **Pas de correction possible après le déploiement.** Comme The DAO, `CTFPlatform` n'a ni owner, ni proxy, ni pause : c'est voulu, pour que personne ne puisse toucher aux fonds. La contrepartie est la même qu'en 2016 : un bug découvert après le déploiement ne se corrige pas. Les parades sont en amont (tests d'attaque, invariants, Slither) et dans l'exposition : chaque CTF est borné (200 joueurs au plus, cautions dimensionnées), et la plateforme ne tourne que sur un testnet.
- **Pas de délai de sécurité global.** The DAO a été sauvée par les 28 jours de blocage de la child DAO. Pwnpot a une fenêtre de contestation et un arbitre, mais seulement pour juger une triche dans un CTF, pas pour geler la plateforme si elle était attaquée.

---

## Sources

1. Wikipedia, « [The DAO](https://en.wikipedia.org/wiki/The_DAO) » : levée, montant volé, hard fork, Ethereum Classic.
2. Vitalik Buterin, « [CRITICAL UPDATE Re: DAO Vulnerability](https://blog.ethereum.org/2016/06/17/critical-update-re-dao-vulnerability/) », blog de la Fondation Ethereum, 17 juin 2016.
3. Phil Daian, « Analysis of the DAO exploit », Hacking, Distributed, 18 juin 2016 ([archive de l'original](https://web.archive.org/web/20241201011331/https://hackingdistributed.com/2016/06/18/analysis-of-the-dao-exploit/), [copie](https://incidentdatabase.ai/reports/902) ; le site d'origine ne répond plus).
4. Vitalik Buterin, « [Hard Fork Completed](https://blog.ethereum.org/2016/07/20/hard-fork-completed) », blog de la Fondation Ethereum, 20 juillet 2016.
5. SEC, « Report of Investigation Pursuant to Section 21(a) of the Securities Exchange Act of 1934: The DAO », Release No. 81207, 25 juillet 2017 ([communiqué de la SEC](https://www.sec.gov/news/press-release/2017-131), [texte du rapport, copie IOSCO](https://api.iosco.org/library/ico-statements/United%20States%20-%20SEC%20-%20Report%20of%20Investigation%20into%20the%20DAO.pdf)).
6. CoinDesk, « [Understanding The DAO Attack](https://www.coindesk.com/learn/understanding-the-dao-attack) », 25 juin 2016.
7. SiliconANGLE, « [Ethereum DAO attacked, over $55 million of ether cryptocurrency stolen](https://siliconangle.com/2016/06/17/ethereum-dao-attacked-over-55-million-of-ether-cryptocurrency-stolen/) », 17 juin 2016.
8. Corporate Finance Institute, « [DAO Heist](https://corporatefinanceinstitute.com/resources/cryptocurrency/dao-heist/) ».
