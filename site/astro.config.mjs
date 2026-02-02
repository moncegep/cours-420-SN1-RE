// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Cours 420-SN1-RE',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/moncegep/cours-420-SN1-RE' }],
			sidebar: [
				{
					label: 'Cours',
					items: [
						{
							label: 'Semaine 1',
							items: [
								{ label: 'Cours 1: introduction', slug: 'cours/01-introduction' },
								{ label: 'Petits quiz', slug: 'exercices/00-quiz' },
							]
						},
						{
							label: 'Semaine 2',
							items: [
								{ label: 'Modélisation de problème', slug: 'cours/02-modelisation' },
								{
									label: 'Exercices', collapsed: true, items: [
										{ label: 'Utilisation du shell', slug: 'exercices/01-shell' },
										{ label: 'Ses premières lignes de code', slug: 'exercices/01-code' },
									]
								},
							]
						},
						{
							label: 'Semaine 3',
							items: [
								// { label: 'Programme avec condition', slug: 'cours/03-condition' },
								// 	{
								// 	label: 'Exercices', collapsed: true, items: []
								// },
							]
						},
						{
							label: 'Semaine 4',
							items: [
								// { label: 'Programme avec répétition', slug: 'cours/04-simulation' },
							]
						},
						{
							label: 'Semaine 5',
							items: [
								// { label: 'Programme avec interaction', slug: 'cours/05-interaction' },
							]
						},
						{
							label: 'Semaine 6',
							items: [
								// { label: 'Abstraction de comportement', slug: 'cours/06-abstraction' },
							]
						},
					],
				},
				{
					label: 'Référence',
					autogenerate: { directory: 'reference' },
				},
			],
		}),
	],
});
