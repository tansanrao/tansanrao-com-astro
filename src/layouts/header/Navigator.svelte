<script lang="ts">
import { onMount } from "svelte";

type RouteItem = {
	path: string;
	extra?: string[];
	label: string;
};

let { route, routes }: { route: string; routes: RouteItem[] } = $props();

/**
 * Check if a route is currently active based on the current route path
 * @param route - The current route path
 * @param home - The home route path
 * @param path - The navigation item path to check against
 * @param extra - Optional array of additional paths that should be considered active
 * @returns True if the route is active, false otherwise
 */
function active(path: string, extra?: string[]) {
	if (extra?.some(item => item === route)) return true;
	if (path === routes[0].path) return path === route;
	return route.startsWith(path);
}

onMount(() => {
	/** Register route update hook */
	const register = () => window.swup?.hooks.on("page:load", () => (route = window.location.pathname));

	// Register the hook immediately if swup is already enabled, otherwise wait for the enable event
	window.swup ? register() : document.addEventListener("swup:enable", register, { once: true });
});
</script>

{#each routes as item}
	{@const isActive = active(item.path, item.extra)}
	<a
		href={item.path}
		class="inline-flex items-center w-full min-h-11 sm:min-h-0 sm:w-auto sm:px-2.5 sm:py-1 sm:border-b-2 transition-colors duration-150 ease-linear"
		class:max-sm:font-bold={isActive}
		class:text-primary={isActive}
		class:text-secondary={!isActive}
		class:border-primary={isActive}
		class:border-transparent={!isActive}
	>
		{item.label}
	</a>
{/each}
