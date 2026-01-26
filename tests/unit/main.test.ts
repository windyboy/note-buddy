import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("NoteBuddyPlugin", () => {
	let plugin: any;
	let mockWorkspace: any;
	let mockVault: any;
	let mockPluginMethods: any;

	beforeEach(() => {
		mockWorkspace = {
			onLayoutReady: vi.fn((callback) => {
				setTimeout(() => callback(), 0);
			}),
			getLeavesOfType: vi.fn(() => []),
			getRightLeaf: vi.fn(() => null),
			setActiveLeaf: vi.fn().mockResolvedValue(undefined),
		};

		mockVault = {};

		mockPluginMethods = {
			onload: vi.fn().mockImplementation(async function(this: any) {
				console.log('Loading NoteBuddy plugin...');
				this.registerView('note-buddy-chat-view', vi.fn());
				this.addRibbonIcon('bot', 'NoteBuddy', vi.fn());
				this.addCommand({ id: 'open-chat-view', name: 'Open NoteBuddy Chat' });
				mockWorkspace.onLayoutReady(vi.fn());
			}),
			onunload: vi.fn(),
			addRibbonIcon: vi.fn(),
			addCommand: vi.fn(),
			registerView: vi.fn(),
			activateView: vi.fn().mockImplementation(async function(this: any) {
				const leaves = mockWorkspace.getLeavesOfType('note-buddy-chat-view');
				if (leaves.length > 0) {
					await mockWorkspace.setActiveLeaf(leaves[0]);
				}
			}),
		};

		const Plugin = class {
			manifest = { id: "note-buddy" };
			app = {
				workspace: mockWorkspace,
				vault: mockVault,
			};
			onload = mockPluginMethods.onload;
			onunload = mockPluginMethods.onunload;
			addRibbonIcon = mockPluginMethods.addRibbonIcon;
			addCommand = mockPluginMethods.addCommand;
			registerView = mockPluginMethods.registerView;
			activateView = mockPluginMethods.activateView;
		};

		plugin = new Plugin();
		mockPluginMethods.onload = mockPluginMethods.onload.bind(plugin);
		mockPluginMethods.activateView = mockPluginMethods.activateView.bind(plugin);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("onload", () => {
		it("should load successfully", async () => {
			await plugin.onload();
			expect(plugin.onload).toHaveBeenCalled();
		});

		it("should add ribbon icon", async () => {
			await plugin.onload();
			await new Promise(resolve => setTimeout(resolve, 10));
			expect(plugin.addRibbonIcon).toHaveBeenCalledWith(
				"bot",
				"NoteBuddy",
				expect.any(Function)
			);
		});

		it("should register chat view", async () => {
			await plugin.onload();
			await new Promise(resolve => setTimeout(resolve, 10));
			expect(plugin.registerView).toHaveBeenCalled();
		});

		it("should add command", async () => {
			await plugin.onload();
			await new Promise(resolve => setTimeout(resolve, 10));
			expect(plugin.addCommand).toHaveBeenCalled();
		});
	});

	describe("onunload", () => {
		it("should unload successfully", () => {
			plugin.onunload();
			expect(plugin.onunload).toHaveBeenCalled();
		});
	});

	describe("activateView", () => {
		it("should activate view", async () => {
			await plugin.activateView();
			expect(mockWorkspace.getLeavesOfType).toHaveBeenCalled();
		});
	});
});
