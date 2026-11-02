# Exercice 2 — Un script de conversion

**Objectif :** importer `data/legacy.json`, l'export de l'ancienne app, dans la base actuelle, avec un script jetable que vous lancez vous-même.

## Consignes

1. Lisez `data/README.md` (le schéma de l'export) et `scripts/migrations/CLAUDE.md` (les règles d'un script de migration).
2. Commencez par l'analyse, sans code :

   > Lis `data/legacy.json`, `data/README.md` et le schéma actuel dans `backend/src/db/`. Liste chaque piège de la conversion avec un exemple tiré du fichier. Pour chaque piège, propose une règle : on convertit, on fusionne ou on rejette, et pourquoi. N'écris pas de code.

3. Tranchez chaque règle avec Claude : le nom de l'auteur, le `member`, les dates, les doublons, les emprunts sans livre, ce qui est déjà dans la base.
4. Demandez le script dans `scripts/migrations/legacy/`, en TDD, avec ses tests : le dry-run ne change pas la base, la deuxième exécution n'écrit rien, chaque type de ligne rejetée a son test. Un script npm `migrate:legacy` le lance. Les tests tournent sur une base en mémoire ou sur une copie, jamais sur `backend/data/`.
5. Faites vous-même une copie de la base, API arrêtée. Lancez une fois `npm run back` si `backend/data/` n'existe pas encore.
   - macOS : `cp backend/data/library.db ../library-copy.db`
   - Windows (PowerShell) : `Copy-Item backend\data\library.db ..\library-copy.db`
6. **Dry-run** sur la copie : Claude peut le lancer, il n'écrit rien. Lisez le rapport : ce qui sera créé, ce qui est déjà là, chaque ligne rejetée avec sa raison. Une raison vous surprend ? Retour à l'étape 3.
7. **Vous** lancez `--apply` sur la copie, deux fois de suite. Le `settings.json` bloque la forme habituelle de cette commande pour Claude, même dans une commande composée : Claude Code vérifie chaque sous-commande. C'est un filet de sécurité, pas une garantie : la règle compare le texte de la commande, et une autre forme passe, par exemple un chemin absolu vers le script ou `sh -c 'node scripts/migrations/legacy/main.mjs --apply'`. La garantie, c'est que vous seul lancez `--apply`. Sous Windows, Claude Code peut utiliser un outil PowerShell : le `settings.json` a des règles `PowerShell(...)` jumelles des règles `Bash(...)`.
8. Quand la copie est bonne, vous lancez `--apply` sur `backend/data/library.db`, API arrêtée. Puis `npm run back` et `npm run front` : les livres importés sont là.
9. Commitez le script et ses tests. Le jour où la migration est faite partout, le dossier est supprimé.

## Réussi si

- Deux `--apply` de suite : la deuxième exécution n'écrit rien, et son rapport le dit.
- Chaque ligne rejetée a sa raison dans le rapport.
- Un test prouve que le dry-run ne change pas la base.
- C'est vous qui avez lancé chaque `--apply`, jamais Claude.
- `npm test`, `npm run test:coverage`, `npm run lint` et `npm run lint:doc` sont verts.
