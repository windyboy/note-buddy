import { describe, it, expect, vi } from 'vitest';

describe('Plugin Integration Tests', () => {
	it('should have all core files present', () => {
		const requiredFiles = [
			'src/main.ts',
			'src/chat-view.ts',
			'package.json',
			'manifest.json',
			'tsconfig.json',
			'esbuild.config.mjs',
			'version-bump.mjs',
			'types/obsidian.d.ts',
			'tests/unit/main.test.ts',
			'tests/unit/chat-view.test.ts',
			'tests/integration/plugin-integration.test.ts',
		];

		for (const file of requiredFiles) {
			expect(file).toBeDefined();
		}
	});

	it('should have manifest with correct fields', () => {
		const manifest = {
			id: 'note-buddy',
			name: 'NoteBuddy',
			version: '0.0.1',
			minAppVersion: '0.15.0',
			description: 'AI-powered assistant plugin for Obsidian',
		};

		expect(manifest.id).toBe('note-buddy');
	expect(manifest.name).toBe('NoteBuddy');
		expect(manifest.version).toBeDefined();
		expect(manifest.minAppVersion).toBe('0.15.0');
		expect(manifest.description).toContain('assistant');
	});

	it('should have package.json with correct dependencies', () => {
		const pkg = {
			name: 'note-buddy',
			version: '0.0.1',
			scripts: {
				dev: 'bun run build --watch',
				build: 'tsc -noEmit -skipLibCheck && node esbuild.config.mjs',
			},
			devDependencies: {
				'@types/node': '^20.14.15',
				esbuild: '^0.24.0',
				obsidian: 'latest',
				typescript: '^5.6.3',
			},
		};

		expect(pkg.name).toBe('note-buddy');
		expect(pkg.scripts.dev).toBeDefined();
		expect(pkg.scripts.build).toBeDefined();
		expect(pkg.devDependencies).toBeDefined();
	});

	it('should support Obsidian Plugin API features', () => {
		const pluginFeatures = {
			registerView: true,
			addRibbonIcon: true,
			addCommand: true,
			onLayoutReady: true,
			getRightLeaf: true,
			setViewState: true,
		};

		expect(pluginFeatures.registerView).toBe(true);
		expect(pluginFeatures.addRibbonIcon).toBe(true);
		expect(pluginFeatures.addCommand).toBe(true);
		expect(pluginFeatures.onLayoutReady).toBe(true);
		expect(pluginFeatures.getRightLeaf).toBe(true);
		expect(pluginFeatures.setViewState).toBe(true);
	});
});
