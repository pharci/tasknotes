import type TaskNotesPlugin from "../main";
import type { TaskInfo } from "../types";
import { stringifyUnknown } from "../utils/stringUtils";
import { renderTextWithLinks, type LinkServices } from "./renderers/linkRenderer";

export interface TaskCardTitleOptions {
	displayText?: string;
	isCompleted?: boolean;
	secondaryProperty?: string;
}

export interface CreateTaskCardTitleOptions extends TaskCardTitleOptions {
	contentContainer: HTMLElement;
	layout: "default" | "compact" | "inline";
	task: TaskInfo;
	plugin: TaskNotesPlugin;
}

export interface UpdateTaskCardTitleOptions extends TaskCardTitleOptions {
	card: HTMLElement;
	task: TaskInfo;
	plugin: TaskNotesPlugin;
}

export function getTaskCardTitleText(task: TaskInfo, displayText?: string): string {
	return stringifyUnknown(displayText).trim() || stringifyUnknown(task.title);
}

export function renderTaskCardTitleText(
	container: HTMLElement,
	task: TaskInfo,
	plugin: TaskNotesPlugin,
	displayText?: string
): void {
	container.empty();
	const linkServices: LinkServices = {
		metadataCache: plugin.app.metadataCache,
		workspace: plugin.app.workspace,
		sourcePath: task.path,
	};

	renderTextWithLinks(container, getTaskCardTitleText(task, displayText), linkServices);
}

export function getTaskCardSecondaryPropertyText(
	task: TaskInfo,
	plugin: TaskNotesPlugin,
	propertyName?: string
): string {
	const key = propertyName?.trim();
	if (!key || !task.path) {
		return "";
	}

	const value = plugin.app.metadataCache.getCache(task.path)?.frontmatter?.[key];
	return stringifyUnknown(value).trim();
}

function renderTaskCardSecondaryProperty(
	container: HTMLElement,
	task: TaskInfo,
	plugin: TaskNotesPlugin,
	propertyName?: string
): void {
	const text = getTaskCardSecondaryPropertyText(task, plugin, propertyName);
	if (!text) {
		container.remove();
		return;
	}

	container.empty();
	container.textContent = text;
}

export function syncTaskCardTitleCompletion(card: HTMLElement, isCompleted: boolean): void {
	const titleEl = card.querySelector<HTMLElement>(".task-card__title");
	const titleTextEl = card.querySelector<HTMLElement>(".task-card__title-text");
	titleEl?.classList.toggle("completed", isCompleted);
	titleTextEl?.classList.toggle("completed", isCompleted);
}

export function createTaskCardTitle(options: CreateTaskCardTitleOptions): {
	titleEl: HTMLElement;
	titleTextEl: HTMLElement;
} {
	const {
		contentContainer,
		layout,
		task,
		plugin,
		displayText,
		isCompleted = false,
		secondaryProperty,
	} = options;
	const titleEl = contentContainer.createEl(layout === "inline" ? "span" : "div", {
		cls: "task-card__title",
	});
	const titleTextEl = titleEl.createSpan({ cls: "task-card__title-text" });

	renderTaskCardTitleText(titleTextEl, task, plugin, displayText);
	titleEl.classList.toggle("completed", isCompleted);
	titleTextEl.classList.toggle("completed", isCompleted);

	if (secondaryProperty && layout !== "inline") {
		const secondaryEl = contentContainer.createEl("div", {
			cls: "task-card__secondary-property",
		});
		renderTaskCardSecondaryProperty(secondaryEl, task, plugin, secondaryProperty);
	}

	return { titleEl, titleTextEl };
}

export function updateTaskCardTitle(options: UpdateTaskCardTitleOptions): void {
	const { card, task, plugin, displayText, isCompleted = false, secondaryProperty } = options;
	const titleTextEl = card.querySelector<HTMLElement>(".task-card__title-text");
	if (titleTextEl) {
		renderTaskCardTitleText(titleTextEl, task, plugin, displayText);
	}

	const contentContainer = card.querySelector<HTMLElement>(".task-card__content");
	const existingSecondary = card.querySelector<HTMLElement>(".task-card__secondary-property");
	if (secondaryProperty && contentContainer) {
		const secondaryEl =
			existingSecondary ||
			contentContainer.createEl("div", { cls: "task-card__secondary-property" });
		renderTaskCardSecondaryProperty(secondaryEl, task, plugin, secondaryProperty);
	} else {
		existingSecondary?.remove();
	}

	syncTaskCardTitleCompletion(card, isCompleted);
}
