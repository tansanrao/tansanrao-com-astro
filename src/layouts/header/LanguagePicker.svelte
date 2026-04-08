<script lang="ts">
import { onMount } from "svelte";
import config from "$config";
import i18nit from "$i18n";

let { locale, route }: { locale: string; route: string } = $props();

let path: string = $derived.by(() => {
	const prefix = locale === config.i18n.defaultLocale ? "" : `/${locale}`;
	return route.slice(prefix.length) || "/";
});

function getLocaleHref(target: string) {
	const prefix = target === config.i18n.defaultLocale ? "" : `/${target}`;
	return `${prefix}${path === "/" ? "" : path}` || "/";
}

onMount(() => {
	/** Register route update hook */
	const register = () => window.swup?.hooks.on("page:load", () => (route = window.location.pathname));

	// Register the hook immediately if swup is already enabled, otherwise wait for the enable event
	window.swup ? register() : document.addEventListener("swup:enable", register, { once: true });
});
</script>

{#each config.i18n.locales as target}
	<a data-no-swup href={getLocaleHref(target)} lang={target} aria-current={locale === target ? "page" : undefined} class={locale === target ? "font-bold sm:bg-primary sm:text-background pointer-events-none" : ""}>{i18nit(target)("language")}</a>
{/each}
