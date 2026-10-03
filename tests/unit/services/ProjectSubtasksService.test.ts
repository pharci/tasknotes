import { TFile } from "obsidian";
import { ProjectSubtasksService } from "../../../src/services/ProjectSubtasksService";

interface CreateServiceOptions {
	projectReference: unknown;
	includeResolvedLink?: boolean;
	parentPath?: string;
	childPath?: string;
	resolvedTargetPath?: string;
	includeParentInVaultFiles?: boolean;
}

function createService({
	projectReference,
	includeResolvedLink = true,
	parentPath = "Projects/Parent.md",
	childPath = "Tasks/Child.md",
	resolvedTargetPath = parentPath,
	includeParentInVaultFiles = false,
}: CreateServiceOptions): {
	service: ProjectSubtasksService;
	parentFile: TFile;
} {
	const parentFile = new TFile(parentPath);
	const childFile = new TFile(childPath);
	const metadataCache = {
		resolvedLinks: includeResolvedLink
			? {
					[childFile.path]: {
						[parentFile.path]: 1,
					},
				}
			: {},
		getFileCache: jest.fn(() => ({ frontmatter: { projects: projectReference } })),
		getCache: jest.fn(() => ({
			frontmatter: { tags: ["task"], projects: projectReference },
		})),
		getFirstLinkpathDest: jest.fn(() => new TFile(resolvedTargetPath)),
	};
	const service = new ProjectSubtasksService({
		app: {
			metadataCache,
			vault: {
				getAbstractFileByPath: (path: string) =>
					path === childFile.path ? childFile : null,
				getMarkdownFiles: () =>
					includeParentInVaultFiles ? [childFile, parentFile] : [childFile],
			},
		},
		cacheManager: {
			getTaskInfo: jest.fn(async () => ({
				path: childFile.path,
				title: "Lesson",
				status: "open",
				priority: "normal",
				archived: false,
			})),
			isTaskFile: jest.fn(() => true),
		},
		fieldMapper: {
			toUserField: jest.fn(() => "projects"),
		},
	} as never);

	return { service, parentFile };
}

function createServiceWithPartiallyIndexedTasks(): {
	service: ProjectSubtasksService;
	parentFile: TFile;
} {
	const parentFile = new TFile("Courses/Math.md");
	const indexedTaskFile = new TFile("Tasks/Indexed.md");
	const unindexedTaskFile = new TFile("Tasks/Unindexed.md");
	const taskFiles = [indexedTaskFile, unindexedTaskFile];
	const metadataCache = {
		resolvedLinks: {
			[indexedTaskFile.path]: {
				[parentFile.path]: 1,
			},
		},
		getFileCache: jest.fn(() => ({
			frontmatter: { course: "[[Courses/Math]]" },
		})),
		getFirstLinkpathDest: jest.fn(() => parentFile),
	};
	const service = new ProjectSubtasksService({
		app: {
			metadataCache,
			vault: {
				getAbstractFileByPath: (path: string) =>
					taskFiles.find((file) => file.path === path) ?? null,
				getMarkdownFiles: () => taskFiles,
			},
		},
		cacheManager: {
			getTaskInfo: jest.fn(async (path: string) => ({
				path,
				title: path,
				status: "open",
				priority: "normal",
				archived: false,
			})),
		},
		fieldMapper: {
			toUserField: jest.fn(() => "course"),
		},
	} as never);

	return { service, parentFile };
}

describe("ProjectSubtasksService project links", () => {
	it("finds tasks with a single project link", async () => {
		const { service, parentFile } = createService({ projectReference: "[[Projects/Parent]]" });

		await expect(service.getTasksLinkedToProject(parentFile)).resolves.toMatchObject([
			{ path: "Tasks/Child.md" },
		]);
	});

	it("finds tasks with a project link missing from resolved links", async () => {
		const { service, parentFile } = createService({
			projectReference: "[[Projects/Parent]]",
			includeResolvedLink: false,
		});

		await expect(service.getTasksLinkedToProject(parentFile)).resolves.toMatchObject([
			{ path: "Tasks/Child.md" },
		]);
	});

	it("matches a folder-qualified reference when resolution selects another matching note", async () => {
		const parentPath = "Areas/Projects/Parent.md";
		const childPath = "Areas/Projects/Child.md";
		const { service, parentFile } = createService({
			projectReference: "[[Projects/Parent]]",
			parentPath,
			childPath,
			resolvedTargetPath: "Archive/Parent.md",
			includeParentInVaultFiles: true,
		});

		await expect(service.getTasksLinkedToProject(parentFile)).resolves.toMatchObject([
			{ path: childPath },
		]);
		expect(service.isTaskUsedAsProjectSync(parentFile.path)).toBe(true);
	});

	it("matches a folder-qualified reference when Obsidian cannot resolve it", async () => {
		const parentPath = "Areas/Projects/Parent.md";
		const childPath = "Areas/Projects/Child.md";
		const { service, parentFile } = createService({
			projectReference: "[[Projects/Parent]]",
			includeResolvedLink: false,
			parentPath,
			childPath,
			resolvedTargetPath: "Areas/Unrelated.md",
			includeParentInVaultFiles: true,
		});

		await expect(service.getTasksLinkedToProject(parentFile)).resolves.toMatchObject([
			{ path: childPath },
		]);
		expect(service.isTaskUsedAsProjectSync(parentFile.path)).toBe(true);
	});

	it("includes matching tasks when resolved links only contain some subtasks", async () => {
		const { service, parentFile } = createServiceWithPartiallyIndexedTasks();

		await expect(service.getTasksLinkedToProject(parentFile)).resolves.toMatchObject([
			{ path: "Tasks/Indexed.md" },
			{ path: "Tasks/Unindexed.md" },
		]);
	});

	it("recognizes a note with a single project link as having related tasks", () => {
		const { service, parentFile } = createService({ projectReference: "[[Projects/Parent]]" });

		expect(service.isTaskUsedAsProjectSync(parentFile.path)).toBe(true);
	});
});
