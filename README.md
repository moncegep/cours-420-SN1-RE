# cours-420-SN1-RE - Programmation en sciences

[![Licence: CC BY 4.0](https://img.shields.io/badge/Licence-CC%20BY%204.0-lightgrey.svg)](LICENSE)
[![Site](https://img.shields.io/badge/site-en%20ligne-brightgreen)](https://cours-420sn1re.netlify.app/)


Ce dépôt contient le matériel pédagogique du cours **Programmation en sciences** (420-SN1-RE), un cours de **niveau collégial (CÉGEP)** destiné aux étudiants du programme de **Sciences de la nature**.

Le cours vise à initier les étudiants à la **programmation comme outil scientifique**, en mettant l’accent sur la résolution de problèmes, l’analyse de données et la pensée algorithmique. Le langage de programmation utilisé est **Python**.

> Site du cours : https://cours-420sn1re.netlify.app/

## Contenu du cours

Le site regroupe l’ensemble du matériel pédagogique :

- **Cours magistraux** : Concepts fondamentaux, théorie et exemples
- **Exercices** : Problèmes pratiques, quiz et exercices corrigés
- **Références** : Fiche de référence, aide-mémoire et rappels syntaxiques

## Public cible et prérequis

- Étudiants de **Sciences de la nature**
- **Aucun prérequis en programmation**
- Connaissances de base en mathématiques du collégial recommandées

## Technologies utilisées

- **[Astro](https://astro.build/)** : Framework web statique haute performance
- **[Starlight](https://starlight.astro.build/)** : Thème de documentation pour Astro
- **[React](https://react.dev/)** : Composants interactifs
- **Markdown/MDX** : Format de contenu

## Installation et exécution locale

### Prérequis

- Node.js 18.x ou supérieur
- npm ou yarn

### Étapes

1. Clonez le dépôt :
```bash
git clone git@github.com:moncegep/cours-420-SN1-RE.git
cd cegep/cours-420-SN1-RE/site
```

1. Installer les dépendances :

```bash
npm install
```

3. Lancer le serveur de développement :

```bash
npm run dev
```

Le site sera accessible à 👉 `http://localhost:4321`

## Ajouter ou modifier du contenu

Le contenu est organisé en fichiers Markdown (.md) et MDX (.mdx) dans `site/src/content/docs/`. 

Pour ajouter une nouvelle page :
1. Créez un fichier `.mdx` dans le dossier approprié
2. Ajoutez les métadonnées frontmatter
3. Écrivez votre contenu

> Les modifications sont immédiatement visibles en mode développement (`npm run dev`).

## Déploiement

> Le site est présentement déployé via le service [**Netlify**](https://www.netlify.com/)

Pour générer la version de production du site :

```bash
npm run build
```

Les fichiers générés se trouvent dans le dossier `dist/`.

## Contribuer

Les contributions sont bienvenues, en particulier de la part d’enseignants :

- Ouvrez une **issue** pour discuter des changements majeurs.
- Proposez des **pull requests** avec une description claire des modifications.
- Respectez la structure existante et les conventions de nommage.
- Le contenu doit être rédigé en français

## Licence

Ce projet est distribué sous la licence [Creative Commons Attribution 4.0 International (CC BY 4.0)](LICENSE).

Vous êtes libre de :
- **Partager** : copier et redistribuer le matériel sous n'importe quel format ou média
- **Adapter** : remixer, transformer et développer le matériel à toute fin, même commerciale

À condition de :
- **Attribuer** : créditer l'auteur original et indiquer les modifications apportées

Pour plus de détails, consultez le fichier [LICENSE](LICENSE).

## Contact

**Mainteneur**: [Louis-Edouard Lafontant](mailto:Louis-Edouard.Lafontant@collegeahuntsic.qc.ca)

