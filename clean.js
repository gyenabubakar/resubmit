import { rimraf } from 'rimraf';

const folders = ['node_modules', 'build', 'dist', '.svelte-kit', '.out', '.cache', '.vite'];
const workspaces = ['frameworks/**', 'website'];

const workspacePaths = (() => {
	const joinedWorkspaceFolders = workspaces.map((workspace) => {
		return folders.map((folder) => workspace + '/' + folder);
	});
	return joinedWorkspaceFolders.flat();
})();

await Promise.all([rimraf(workspacePaths, { glob: true }), rimraf(folders)]);
