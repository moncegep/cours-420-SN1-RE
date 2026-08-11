// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import react from '@astrojs/react';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [rehypeKatex],
	},
	integrations: [
		mermaid(),
		starlight({
			title: 'Prog. en sciences',
			defaultLocale: 'root',
			locales: {
				root: {
					label: 'Français',
					lang: 'fr',
				}
			},
			customCss: [
				'./src/styles/custom.css',
			],
			sidebar: [
				{
					label: 'Bases de la programmation',
					items: [
						{
							label: 'Semaine 1',
							collapsed: true,
							items: [
								// { label: 'Cours 1: introduction', slug: 'cours/01-introduction' },
								{
									label: 'Exercices', items: [
										{ label: "Prise en main de IDLE", slug: "exercices/01-shell" },
										// { label: 'Variables et opérations', slug: 'exercices/01-variable' },
									]
								},
							]
						},
						{
							label: 'Semaine 2',
							collapsed: true,
							items: [
								// { label: 'Modélisation de problème', slug: 'cours/02-modelisation' },
								{
									label: 'Exercices', items: [
										{ label: 'Variables et opérations', slug: 'exercices/01-variable' },
										{ label: "Programme interactif", slug: "exercices/02-interactif" },
									]
								},
							]
						},
						{
							label: 'Semaine 3',
							collapsed: true,
							items: [
								{ label: 'Flux conditionnels avec if-else', slug: 'cours/03-condition' },
								{
									label: 'Exercices',
									collapsed: true,
									items: [
										{ label: "Programme avec condition", slug: "exercices/03-ifelse" },
									]
								},
								{
									label: 'Problèmes',
									collapsed: true,
									items: [
										{ label: "Ergonomie d'une chaise", slug: "problemes/01-ergonomie-chaise" },
										// { label: "Note musicale", slug: "problemes/01-note-musicale" },
									]
								},
							]
						},
						{
							label: 'Semaine 4',
							collapsed: true,
							items: [
								{ label: 'Flux conditionnels avec match-case', slug: 'cours/04-condition-multiple' },
								// {
								// 	label: 'Exercices', items: [
								// 		{ label: "Programme avec condition", slug: "exercices/03-ifelse" },
								// 	]
								// },

								// { label: 'Programme avec répétition', slug: 'cours/04-simulation' },
							]
						},
						{
							label: 'Semaine 5',
							collapsed: true,
							items: [
								{ label: 'Flux avec répétition', slug: 'cours/05-repetition' },
							]
						}
					],
				},
				{
					label: "Fonctions et modules",
					items: [
						{
							label: 'Semaine 6',
							collapsed: true,
							items: [
								{ label: "Répétitions controlées", slug: 'cours/06-repetition-controle' },
								{ label: 'Fonctions et modules', slug: 'cours/06-modules' },
								{
									label: 'Exercices',
									collapsed: true,
									items: [
										{ label: "Maitriser les boucles", slug: "exercices/05-repetitions" },
									]
								}
							]
						},
						{
							label: 'Semaine 7',
							collapsed: true,
							items: [
								{ label: 'Définition de fonctions', slug: 'cours/07-fonctions-def' }
							]
						}
					]
				},
				{
					label: "Structure de données",
					items: [
						{
							label: 'Semaine 8',
							items: [
								{ label: 'Structure: les listes', slug: 'cours/08-liste' },
								{ label: "Exercices", slug: "exercices/08-exos-liste" },
							]
						},
						{
							label: 'Semaine 10',
							items: [
								{ label: 'Structures avancées', slug: 'cours/09-struct' }
							]
						},
						{
							label: 'Semaine 11',
							items: [
								{ label: 'Traitement de texte', slug: 'cours/10-texte' },
								{ label: "Exercices", slug: "exercices/10-exos-texte" }
							]
						},
						{
							label: 'Semaine 12',
							items: [
								{ label: 'Numpy: Manipulations', slug: 'cours/11-numpy-manipulations' },
								{ label: 'Numpy: Analyse', slug: 'cours/11-numpy-analyses' },
								{ label: "Exercices", slug: "exercices/11-exercices-numpy" }
							]
						},
						{
							label: 'Semaine 13',
							items: [
								{ label: 'Matplotlib', slug: 'cours/12-matplotlib' }
							]
						},
						{
							label: 'Semaine 14',
							items: [
								{ label: 'Fichiers et erreurs', slug: 'cours/13-fichiers-erreurs' }
							]
						},
					]
				},
				{
					label: 'Guide',
					items: [{ autogenerate: { directory: 'guide' } }]
				},
				{
					label: 'Projets',
					items: [
						{
							label: "Projet 1: Mario",
							slug: 'projets/projet-01-mario'
						},
						{
							label: "Projet 1: Mario (construction)",
							slug: 'projets/projet-01-mario-construction'
						},
						{
							label: "Projet 1: Mario (solution)",
							slug: 'projets/projet-01-mario-code'
						}
					]
				},
				{
					label: 'Examen',
					items: [
						{
							label: "Préparation d'examen intra",
							slug: 'examens/01-examen-intra'
						},
						{
							label: "Préparation d'examen final",
							slug: 'examens/02-examen-final'
						},
						{
							label: "Aide-mémoire (examen final)",
							slug: 'examens/aide-memoire'
						}
					]
				},
				// {
				// 	label: 'Référence',
				// 	autogenerate: { directory: 'reference' },
				// },
			],
		}),
		react(),
	],
});
