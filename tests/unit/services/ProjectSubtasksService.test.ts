import { TFile } from "obsidian";
import { ProjectSubtasksService } from "../../../src/services/ProjectSubtasksService";

function createService(courseValue: unknown): {
	service: ProjectSubtasksService;
	parentFile: TFile;
} {
	const parentFile = new TFile("Courses/Math.md");
	const childFile = new TFile("Tasks/Lesson.md");
	const metadataCache = {
		resolvedLinks: {
			[childFile.path]: {
				[parentFile.path]: 1,
			},
		},
		getFileCache: jest.fn(() => ({
			frontmatter: { course: courseValue },
		})),
		getCache: jest.fn(() => ({
			frontmatter: { tags: ["task"], course: courseValue },
		})),
		getFirstLinkpathDest: jest.fn(() => parentFile),
	};
	const service = new ProjectSubtasksService({
		app: {
			metadataCache,
			vault: {
				getAbstractFileByPath: (path: string) =>
					path === childFile.path ? childFile : null,
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
			toUserField: jest.fn(() => "course"),
		},
	} as never);

	return { service, parentFile };
}

describe("ProjectSubtasksService course links", () => {
	it("finds tasks with a single course link", async () => {
		const { service, parentFile } = createService("[[Courses/Math]]");

		await expect(service.getTasksLinkedToProject(parentFile)).resolves.toMatchObject([
			{ path: "Tasks/Lesson.md" },
		]);
	});

	it("recognizes a note with a single course link as having related tasks", () => {
		const { service, parentFile } = createService("[[Courses/Math]]");

		expect(service.isTaskUsedAsProjectSync(parentFile.path)).toBe(true);
	});
});
