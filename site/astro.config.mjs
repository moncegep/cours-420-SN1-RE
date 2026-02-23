// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
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
			title: 'Cours 420-SN1-RE',
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
							items: [
								{ label: 'Flux conditionnels avec if-else', slug: 'cours/03-condition' },
								{
									label: 'Exercices', items: [
										{ label: "Programme avec condition", slug: "exercices/03-ifelse" },
									]
								},
								{
									label: 'Problèmes', items: [
										{ label: "Ergonomie d'une chaise", slug: "problemes/01-ergonomie-chaise" },
										// { label: "Note musicale", slug: "problemes/01-note-musicale" },
									]
								},
							]
						},
						{
							label: 'Semaine 4',
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
						},
						// {
						// 	label: 'Semaine 6',
						// 	items: [
						// 		// { label: 'Abstraction de comportement', slug: 'cours/06-abstraction' },
						// 	]
						// },
					],
				},
				// {
				// 	label: 'Référence',
				// 	autogenerate: { directory: 'reference' },
				// },
			],
		}),
	],
});
