import { rimraf } from 'rimraf';

const folders = ['node_modules', 'build', 'dist', '.svelte-kit', '.out', '.cache', '.vite'];

const workspacePaths = (() => {
	const workspaces = ['source', 'website'];
	const joinedWorkspaceFolders = workspaces.map((workspace) => {
		return folders.map((folder) => workspace + '/' + folder);
	});
	return joinedWorkspaceFolders.flat();
})();

await rimraf(workspacePaths);
await rimraf(folders);
