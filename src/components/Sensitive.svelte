<script lang="ts">
import type { Snippet } from "svelte";

let { sensitive = false, back, children }: { sensitive: boolean; back: string; children: Snippet } = $props();

if (sensitive) {
	$effect(() => {
		if (!sensitive) window.zoom();
	});
}
</script>

{#if sensitive}
	<div transition:fade={{ duration: 150 }} class="flex flex-col items-center justify-end gap-6">
		<h2>Content Warning</h2>
		<div class="flex flex-col items-center justify-end gap-3">
			<p>This content may contain explicit, violent, bloody, or emotionally triggering material.</p>
			<p>If this content might affect your mental health, please leave immediately!</p>
		</div>
		<div class="flex gap-3">
			<button class="font-bold text-background bg-red-500 py-1 px-2 rounded-md" onclick={() => (sensitive = false)}>
				I understand, continue reading
			</button>
			<a href={back} class="flex items-center font-bold text-background bg-secondary py-1 px-2 rounded-md">
				Return to list
			</a>
		</div>
	</div>
{:else}
	<div transition:fade={{ delay: 150, duration: 150 }}>{@render children()}</div>
{/if}
