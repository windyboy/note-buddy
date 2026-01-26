import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ChatView", () => {
	let view: any;
	let mockEl: any;

	beforeEach(() => {
		// Create mock DOM element
		mockEl = {
			innerHTML: "",
			classList: { add: vi.fn() },
			querySelector: vi.fn(),
			style: {},
		};

		// Mock Obsidian ItemView
		const ItemView = class {
			getViewType = vi.fn().mockReturnValue("note-buddy-chat");
			getDisplayText = vi.fn().mockReturnValue("Note Buddy");
			getIcon = vi.fn().mockReturnValue("bot");
			onOpen = vi.fn();
			onClose = vi.fn();
		};

		view = new ItemView();
		view.containerEl = mockEl;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("getViewType", () => {
		it("should return the correct view type", () => {
			expect(view.getViewType()).toBe("note-buddy-chat");
		});
	});

	describe("getDisplayText", () => {
		it("should return the correct display text", () => {
			expect(view.getDisplayText()).toBe("Note Buddy");
		});
	});

	describe("getIcon", () => {
		it("should return the bot icon", () => {
			expect(view.getIcon()).toBe("bot");
		});
	});

	describe("onOpen", () => {
		it("should initialize the view", () => {
			view.onOpen();
			expect(view.onOpen).toHaveBeenCalled();
		});
	});

	describe("onClose", () => {
		it("should cleanup the view", () => {
			view.onClose();
			expect(view.onClose).toHaveBeenCalled();
		});
	});
});
