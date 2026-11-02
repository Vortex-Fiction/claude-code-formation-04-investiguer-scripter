---
marp: true
theme: default
paginate: true
title: Phase 4 — Investiguer, scripter, capitaliser
---

# Phase 4 — Investiguer, scripter, capitaliser

Bien utiliser Claude Code en développement

Repo : `claude-code-formation-04-investiguer-scripter`

---

# Partage de réussite

- Une feature livrée en PR depuis une spec et un plan
- Une critique de revue que l'agent a vérifiée au lieu de céder
- Un test rouge qui vous a sauvé d'un faux « ça marche »
- 10 minutes, deux ou trois personnes

---

# Le lendemain, vous saurez…

- confier un incident à Claude sans le laisser toucher à la prod
- exiger une preuve à chaque étape d'une investigation
- faire écrire un script de migration qui ne casse rien
- garder l'exécution des mutations pour vous
- transformer une démarche répétée en skill

---

# Investiguer : la boucle en 5 étapes

1. **Reproduire** — voir l'erreur soi-même, en local
2. **Hypothèse** — une cause, et la preuve qui la trancherait
3. **Vérifier** — la preuve, pas l'intuition
4. **Corriger** — le test rouge d'abord, puis le correctif
5. **Valider** — l'erreur d'origine ne se reproduit plus

<!-- Sans la boucle, l'agent saute de l'erreur au correctif. Il corrige ce qu'il croit être la cause, les tests passent, et le bug revient. Chaque étape a sa preuve : on ne passe pas à la suivante sans elle. Pour l'animateur : certaines 500 des logs ne se reproduisent pas sur la base neuve, car la prod a des données que la base locale n'a pas (par exemple « North of the Quiet River », authorId 8 → 404 en local). C'est un écart prod/local, pas une fausse piste du bug. Faites rejouer la requête « Pride and Prejudice » : elle donne la 500 sur la base neuve. -->

---

# Lire des logs avec Claude

- Donnez les logs bruts, pas votre résumé
- Une erreur → son identifiant de requête → toutes ses lignes
- Comparer : la requête qui échoue et celle qui passe
- Chercher ce qui a changé : un déploiement, une version
- Grands volumes : `grep` d'abord, Claude lit le résultat

<!-- Un fichier de logs de plusieurs mégaoctets remplit le contexte. Faites filtrer par une commande, puis lire. Le détail utile est souvent dans un champ : l'entrée de la requête, un paramètre, une ligne de la trace. -->

---

# Les fausses pistes

- Les logs de prod ont toujours du bruit : alertes, lenteurs, tâches
- Une alerte au même moment n'est pas une cause
- Une piste écartée l'est par une preuve : une durée, une trace, une date
- « Ça n'a sûrement rien à voir » : demandez la preuve
- Une seule hypothèse à la fois, jusqu'à la vérification

<!-- L'agent aime une explication plausible. Si une alerte de latence tombe à la même minute qu'une erreur, il la retient. Demandez-lui : est-ce que les erreurs arrivent aussi hors de cette fenêtre ? Est-ce que les requêtes en erreur sont lentes ? -->

---

# Lecture seule, les mutations vont à l'humain

- L'agent lit : logs, code, état du cloud, sans mutation
- Les commandes `gcloud`, `kubectl`, `aws` qui écrivent : pour vous
- L'agent vous donne la commande, vous la relisez et la lancez
- En prod, un agent qui « répare vite » aggrave l'incident
- `settings.json` : `deny` sur ce qui mute

<!-- Exemple : les commandes cloud en lecture (lister, décrire, lire les logs) sont autorisées, celles qui modifient vont à l'humain. Même chose pour l'infrastructure en code : l'agent écrit le code, l'humain lance le déploiement. -->

---

# Jamais de commande base de données par l'agent

- Pas de `sqlite3`, `psql`, `mysql` lancés par l'agent
- Pas même en lecture : une requête lourde ralentit la prod
- Pas d'accès direct aux fichiers de la base
- L'agent écrit la requête, vous la lancez
- Le `settings.json` du repo ajoute un filet de sécurité

```json
"deny": ["Bash(sqlite3*)", "Read(/backend/data/**)", "Edit(/backend/data/**)"]
```

<!-- Une règle dans le CLAUDE.md, l'agent peut l'oublier au fil de la session. Une règle deny bloque la forme habituelle de la commande, mais ce n'est pas une garantie : elle compare le texte de la commande. `/usr/bin/sqlite3` ou `sh -c 'sqlite3 …'` passent. Les deny Read et Edit visent les outils de Claude et les commandes de fichiers connues (`cat`, `>`), pas un script Node qui ouvre le fichier lui-même. Pour une vraie barrière : le sandbox de Claude Code. Sous Windows, Claude Code peut utiliser un outil PowerShell : les règles `Bash(...)` ne s'y appliquent pas, d'où les règles `PowerShell(...)` jumelles. -->

---

# Corriger des données : le plus petit SQL

- Une ligne fausse → un `UPDATE` ciblé, avec sa clé
- Pas de script, pas de migration pour trois lignes
- Un `SELECT` d'abord : combien de lignes, lesquelles
- On demande avant un `DELETE`, toujours
- Une transaction, et le résultat vérifié après

```sql
UPDATE loans SET returned_at = '2026-10-28T10:00:00.000Z' WHERE id = 42 AND returned_at IS NULL;
```

<!-- L'agent tend à écrire un script générique avec des options. Pour une correction ponctuelle, le plus petit SQL est le plus facile à relire, donc le plus sûr. -->

---

# Documenter le diagnostic

- Un fichier par incident : `docs/incidents/<date>-<slug>.md`
- Le symptôme, la cause, les preuves
- Les pistes écartées, et pourquoi
- Le correctif, et son test
- Comment le repérer la prochaine fois

<!-- Le prochain incident commence souvent comme le précédent. Le diagnostic écrit évite de refaire la même fausse piste. Il se lit aussi comme un exemple pour l'agent : donnez-lui les diagnostics passés. -->

---

# Scripts jetables

- Une migration de données est du code qui sert une fois
- Un dossier par migration : `scripts/migrations/<nom>/`
- Testé comme le reste, mais supprimé une fois la migration faite
- Pas d'options « au cas où », pas de framework
- Un `CLAUDE.md` dans `scripts/migrations/` pose les règles

<!-- Jetable ne veut pas dire bâclé : ce script écrit dans la base de prod. Il est testé et relu comme le reste. Mais il ne reste pas : du code mort de migration finit par être relancé par erreur. -->

---

# Dry-run d'abord

- Par défaut, le script n'écrit rien
- Il dit ce qu'il va créer, ce qui est déjà là, ce qu'il rejette
- Chaque ligne rejetée a sa raison
- Il écrit seulement avec `--apply`
- Un test prouve que le dry-run ne change pas la base

<!-- Le rapport du dry-run est ce qu'on relit. Une raison de rejet qui surprend, c'est une règle de conversion à trancher, pas une ligne à forcer. -->

---

# Copie et idempotence

- Essai sur une copie de la base, ou une branche de base
- Jamais d'essai sur la vraie base
- Idempotent : deux `--apply` de suite → le deuxième n'écrit rien
- On peut relancer après une panne sans doublons
- Les tests le prouvent : deux exécutions, une seule écriture

<!-- Certaines bases PostgreSQL hébergées se branchent en quelques secondes : on essaie le script sur une branche, puis on la jette. Ici, une copie du fichier SQLite fait la même chose. -->

---

# L'humain exécute

- L'agent écrit le script, les tests, le dry-run
- Vous lancez `--apply`, d'abord sur la copie, puis sur la vraie base
- Le `settings.json` bloque la forme habituelle de `--apply` : un filet, pas une garantie
- Avant `--apply` : le rapport relu, la sauvegarde faite

```json
"deny": ["Bash(node scripts/migrations/* --apply*)", "Bash(npm run migrate:* --apply*)"]
```

<!-- L'agent n'est pas malveillant, il est pressé : après un dry-run propre, il enchaîne avec --apply « pour gagner du temps ». La règle deny bloque ce geste sous sa forme habituelle. Elle compare seulement le texte de la commande : `cd scripts/migrations/legacy && node main.mjs --apply`, un chemin absolu ou un chemin avec des barres obliques inverses passent. La garantie, c'est vous : c'est vous qui lancez --apply. Pour une barrière dure : le sandbox. Sous Windows, Claude Code peut utiliser un outil PowerShell, d'où les règles `PowerShell(...)` jumelles. -->

---

# Capitaliser : ce qu'on refait deux fois

- Une démarche répétée deux fois devient un skill
- Un skill = un `SKILL.md` : quand l'utiliser, les étapes, les règles
- Il remplace le long prompt que vous retapez
- Il garde ce que vous avez dû redire à l'agent
- Exemples : investiguer, préparer une PR, écrire une migration

<!-- Le bon moment : quand vous vous surprenez à recopier le même prompt, ou à redire la même correction en fin de session. -->

---

# Personnel puis partagé

- Personnel d'abord : `~/.claude/skills/<nom>/SKILL.md`
- Il a fait ses preuves → dans le repo : `.claude/skills/<nom>/`
- Ce que plusieurs skills partagent → un dossier commun, par exemple `_shared/`
- Modèles, glossaire, conventions : un seul fichier, les skills donnent son chemin
- Un skill d'équipe se relit en PR, comme du code

<!-- `_shared/` est une convention d'équipe, pas une fonction de Claude Code : Claude Code ne le charge pas seul, chaque skill donne le chemin du fichier à lire. Un tel dossier contient par exemple les modèles de README et de CLAUDE.md, un glossaire et les conventions git. -->

---

# Invocation explicite seulement

Le front matter de `.claude/skills/investigate/SKILL.md`, en tête du fichier entre deux lignes `---` :

```yaml
name: investigate
description: Guide a production investigation in five steps.
disable-model-invocation: true
```

- `disable-model-invocation: true` : l'agent ne le lance jamais seul
- Vous l'appelez : `/investigate <symptôme>`
- Un skill qui se lance seul au mauvais moment coûte du contexte et des surprises

<!-- Sans ce champ, Claude lit la description de chaque skill et décide seul de le charger. Pour un skill qui lance une démarche longue ou qui touche au board, on veut que ce soit vous qui décidiez. -->

---

# Démo : Vortex

- Un incident réel rejoué avec les logs
- Un script de migration de `scripts/migrations/` : dry-run, puis `--apply` par l'humain
- Le skill `vortex-brainstorm` : invocation explicite, `_shared/`

---

# Pratique guidée

```bash
git clone https://github.com/Vortex-Fiction/claude-code-formation-04-investiguer-scripter.git
cd claude-code-formation-04-investiguer-scripter
npm install
npm run back
```

Dans un second terminal : `claude`

On fait ensemble l'exercice 1 : `exercices/01-investiguer.md`

---

# Exercices à faire chez soi

- `exercices/02-script-de-conversion.md` — `data/legacy.json` vers la base, dry-run d'abord
- `exercices/03-capitaliser-en-skill.md` — la démarche de l'exercice 1 en skill
- Une réponse possible : la branche `solution`

Gardez une réussite à partager en ouverture de la phase 5.

---

# La suite : Phase 5 — Autonomie : du ticket à la PR

- `claude -p` : Claude sans session interactive
- Un board GitHub, des labels, des tickets prêts
- Ce qu'on confie sans surveillance, et ce qu'on garde
- Coût : tokens, modèle, niveau d'effort
