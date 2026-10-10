/** Shared modal behavior for the primary navigation and article TOC. */
type DrawerName = "sidebar" | "toc";
const compact = matchMedia("(max-width: 639px)");
const reader = matchMedia("(max-width: 1099px)");
const openers = new Map<DrawerName, HTMLElement>();
const panel = (name: DrawerName) => document.getElementById(name);
const overlay = (name: DrawerName) => document.querySelector(`[data-drawer-overlay="${name}"]`);

function isModal(name: DrawerName) {
	return name === "toc" && panel(name)?.dataset.drawerInlineFrom === "reader" ? reader.matches : compact.matches;
}

function triggerState(name: DrawerName, expanded: boolean) {
	document.querySelectorAll(`[data-drawer-open="${name}"]`).forEach(trigger => {
		trigger.setAttribute("aria-expanded", String(expanded));
	});
}

function close(name: DrawerName, restoreFocus = true) {
	const element = panel(name);
	element?.classList.remove("active");
	overlay(name)?.classList.remove("active");
	triggerState(name, false);
	if (element) {
		element.inert = isModal(name);
		if (isModal(name)) element.setAttribute("aria-hidden", "true");
		else element.removeAttribute("aria-hidden");
	}
	if (document.documentElement.dataset.drawer === name) {
		delete document.documentElement.dataset.drawer;
		document.documentElement.classList.remove("drawer-open");
	}
	const opener = openers.get(name);
	openers.delete(name);
	if (restoreFocus && opener?.isConnected) opener.focus();
}

function open(name: DrawerName, opener: HTMLElement) {
	if (!isModal(name)) return;
	const element = panel(name);
	if (!element || element.closest("details:not([open])")) return;
	for (const other of ["sidebar", "toc"] as const) if (other !== name) close(other, false);
	openers.set(name, opener);
	element.inert = false;
	element.classList.add("active");
	element.setAttribute("aria-hidden", "false");
	overlay(name)?.classList.add("active");
	triggerState(name, true);
	document.documentElement.dataset.drawer = name;
	document.documentElement.classList.add("drawer-open");
	requestAnimationFrame(() => element.querySelector<HTMLElement>(`[data-drawer-close="${name}"]`)?.focus());
}

function synchronize() {
	for (const name of ["sidebar", "toc"] as const) close(name, false);
}

document.addEventListener("click", event => {
	if (!(event.target instanceof Element)) return;
	const trigger = event.target.closest<HTMLElement>("[data-drawer-open], [data-drawer-close], [data-drawer-overlay]");
	if (trigger) {
		const name = trigger.dataset.drawerOpen ?? trigger.dataset.drawerClose ?? trigger.dataset.drawerOverlay;
		if (name === "sidebar" || name === "toc") {
			if (trigger.dataset.drawerOpen) open(name, trigger);
			else close(name);
		}
	}
	if (event.target.closest("#toc a")) close("toc", false);
	if (event.target.closest("#sidebar a")) close("sidebar", false);
});

document.addEventListener("keydown", event => {
	const name = document.documentElement.dataset.drawer;
	if (name !== "sidebar" && name !== "toc") return;
	if (event.key === "Escape") {
		close(name);
		return;
	}
	if (event.key !== "Tab" || !isModal(name)) return;
	const focusable = Array.from(
		panel(name)?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []
	).filter(element => element.getClientRects().length > 0);
	if (!focusable.length) return;
	const first = focusable[0];
	const last = focusable[focusable.length - 1];
	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
});

compact.addEventListener("change", synchronize);
reader.addEventListener("change", synchronize);
synchronize();
document.documentElement.dataset.drawersReady = "true";
