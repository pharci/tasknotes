import { spawnSync } from "node:child_process";

const npmExecPath = process.env.npm_execpath;

const tasks = [
	["run", "lint:ts"],
	["run", "lint:css"],
];

let failed = false;

for (const args of tasks) {
	const result = npmExecPath
		? spawnSync(process.execPath, [npmExecPath, ...args], { stdio: "inherit" })
		: spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", args, {
				stdio: "inherit",
				shell: process.platform === "win32",
			});

	if (result.status !== 0) {
		failed = true;
	}
}

process.exit(failed ? 1 : 0);
