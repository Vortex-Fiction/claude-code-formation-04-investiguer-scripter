# Exercice 1 — Investiguer un incident

**Objectif :** trouver la cause des erreurs 500 de la production à partir des seuls logs et du code, la corriger avec un test, et écrire le diagnostic pour le prochain incident.

**Le signalement :** « Depuis le 27 octobre, l'API renvoie des erreurs 500 de temps en temps. » Vous n'avez pas accès à la production : vous avez ses logs dans `logs/`, trois jours, une entrée JSON par ligne.

## Consignes

1. Lancez `npm run back` dans un terminal : l'API locale tourne sur une base neuve.
2. Fixez le cadre dès le premier message :

   > Les logs de production sont dans `logs/`. Depuis le 27 octobre, l'API renvoie des erreurs 500 de temps en temps. On investigue en cinq étapes : reproduire, hypothèse, vérifier, corriger, valider. Tu lis les logs et le code, et tu peux envoyer des requêtes à l'API locale sur le port 3000. Tu ne lances aucune commande sur la base : pas de `sqlite3`, pas de script qui écrit, pas de suppression de `backend/data/`. Si tu en as besoin, tu me donnes la commande et je la lance. Arrête-toi après chaque étape et montre-moi la preuve.

3. **Reproduire** : Claude trouve dans les logs une requête qui a échoué et la rejoue sur l'API locale. Vous voyez la 500 de vos yeux. Certaines requêtes des logs ne donnent pas la 500 en local : la base de prod a des données que la base neuve n'a pas. Dans ce cas, rejouez la requête du livre « Pride and Prejudice ».
4. **Hypothèse** : Claude écrit une hypothèse, et la preuve qui la confirmerait ou l'infirmerait. Les logs contiennent plusieurs pistes : pour chacune, exigez la preuve qui l'écarte ou la retient, tirée des logs ou d'une requête. « Ça n'a sûrement rien à voir » n'est pas une preuve.
5. **Vérifier** : deux requêtes proches, une qui passe et une qui échoue, expliquées par l'hypothèse. La requête qui passe ne doit rien écrire : une réponse d'erreur attendue, comme une 409, suffit. L'API locale écrit seulement dans la base locale, jamais en prod.
6. **Corriger** : le test d'abord. Il reproduit le bug et vous le voyez échouer. Ensuite le correctif, et le test passe.
7. **Valider** : la requête des logs, rejouée, ne donne plus de 500. `npm test`, `npm run test:coverage`, `npm run lint` sont verts.
8. Demandez le diagnostic dans `docs/incidents/2026-10-27-<slug>.md`, en anglais et en STE : le symptôme, la cause, les preuves, les pistes écartées et pourquoi, le correctif, et comment repérer ce bug la prochaine fois. `npm run lint:doc` doit être vert.
9. Relisez le diff, puis commitez : `fix(<scope>): <Subject>`.

## Réussi si

- Chaque piste écartée l'a été par une preuve (une ligne de log, une durée, une requête), pas par intuition.
- Le test échoue sans le correctif : retirez le correctif seul, lancez `npm test`, le test est rouge.
- Claude n'a lancé aucune commande sur la base.
- Le diagnostic est dans `docs/incidents/`, et un collègue peut le lire sans la conversation.
- La requête des logs ne donne plus de 500 sur l'API locale.
