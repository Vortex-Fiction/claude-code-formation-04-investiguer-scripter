# Exercice 3 — Capitaliser en skill

**Objectif :** transformer la démarche de l'exercice 1 en skill, pour ne plus la réexpliquer au prochain incident.

## Consignes

1. Relisez votre session de l'exercice 1 : ce que vous avez dû redire à Claude, les preuves que vous avez dû exiger, ce qu'il a voulu faire sans demander.
2. Demandez le skill :

   > Écris un skill dans `.claude/skills/investigate/SKILL.md`, en anglais et en STE. Front matter : `name`, `description`, et `disable-model-invocation: true`, pour qu'il se lance seulement quand on l'appelle. Le skill guide les cinq étapes : reproduire, hypothèse, vérifier, corriger, valider, avec une preuve à chaque étape. Il est en lecture seule sur la base : les commandes qui écrivent vont à l'humain. Il finit par le diagnostic dans `docs/incidents/`. Ajoute ce que j'ai dû te redire pendant l'exercice 1 : <vos notes de l'étape 1>.

3. `npm run lint:doc` doit être vert : il vérifie aussi les `SKILL.md`.
4. Ouvrez une nouvelle session. Décrivez un problème sans appeler le skill : il ne doit pas se lancer.
5. Appelez-le : `/investigate les emprunts renvoient parfois une 409 inattendue`. Il doit vous guider étape par étape et s'arrêter pour la preuve.
6. Décidez où il vit : dans `~/.claude/skills/` s'il est personnel, dans `.claude/skills/` du repo s'il sert à l'équipe. Ce que plusieurs skills partagent (un modèle de rapport, un glossaire) va dans un dossier `_shared/`, et chaque skill donne son chemin.
7. Commitez : `feat(skills): Add the investigate skill`.

## Réussi si

- Dans une nouvelle session, le skill se lance seulement quand vous l'appelez.
- Il guide les cinq étapes et demande une preuve à chacune.
- Il contient au moins une règle que vous avez dû redire pendant l'exercice 1.
- `npm run lint:doc` est vert.
