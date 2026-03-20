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
							items: [
								{ label: 'Définition de fonctions', slug: 'cours/07-fonctions-def' },
								// {
								// 	label: "Pour aller plus loin",
								// 	items: [
								// 		{ label: 'Exécution dans le terminal', slug: 'cours/07-terminal' },
								// 	]
								// },
							]
						},
					]
				},
				{
					label: 'Guide',
					autogenerate: { directory: 'guide' },
				},
				{
					label: 'Examen',
					items: [
						{
							label: "Préparation d'examen intra",
							slug: 'examens/01-examen-intra' 
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
