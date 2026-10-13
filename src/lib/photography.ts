import { type CollectionEntry, getCollection } from "astro:content";

/** Resolve the public photography graph and reject broken or mistyped references at build time. */
export async function getPhotography() {
	const [allPhotos, allCollections, equipment] = await Promise.all([
		getCollection("photos"),
		getCollection("photoCollections"),
		getCollection("equipment")
	]);
	const photoById = new Map(allPhotos.map(photo => [photo.id, photo]));
	const equipmentById = new Map(equipment.map(item => [item.id, item]));
	for (const photo of allPhotos) {
		for (const kind of ["camera", "lens", "film"] as const) {
			const ref = photo.data[kind];
			if (ref && equipmentById.get(ref.id)?.data.kind !== kind) {
				throw new Error(`Photo ${photo.id}: ${kind} must reference existing ${kind} equipment (${ref.id})`);
			}
		}
	}
	for (const collection of allCollections) {
		if (collection.id === "photos" || collection.id.startsWith("photos/")) {
			throw new Error("The collection ID photos is reserved for uncollected photographs");
		}
		for (const entry of collection.data.entries) {
			const photo = photoById.get(entry.photo.id);
			if (!photo) throw new Error(`Collection ${collection.id}: missing photo ${entry.photo.id}`);
			if (!collection.data.draft && photo.data.draft) {
				throw new Error(`Collection ${collection.id}: publish photo ${photo.id} before including it in a public collection`);
			}
		}
	}
	const photos = allPhotos.filter(photo => !photo.data.draft);
	const collections = allCollections.filter(collection => !collection.data.draft);
	const uncollected = photos.filter(photo => !collections.some(collection => collection.data.entries.some(item => item.photo.id === photo.id)));
	const paths = new Set(collections.map(collection => photoCollectionPath(collection.id)));
	for (const path of [
		...collections.flatMap(collection => collection.data.entries.map(item => photoPath(collection, item))),
		...uncollected.map(photo => `/photography/photos/${photo.id}`)
	]) {
		if (paths.has(path)) throw new Error(`Duplicate photography URL: ${path}. Use distinct photo slugs within each collection.`);
		paths.add(path);
	}
	return { photos, collections, uncollected, photoById, equipmentById };
}

export function photoCollectionPath(id: string) {
	return `/photography/${id}`;
}

export function photoPath(collection: CollectionEntry<"photoCollections">, item: CollectionEntry<"photoCollections">["data"]["entries"][number]) {
	return `${photoCollectionPath(collection.id)}/${item.slug ?? item.day}`;
}

export function orderedPhotoEntries(collection: CollectionEntry<"photoCollections">) {
	const entries = [...collection.data.entries];
	return collection.data.kind === "daily" ? entries.sort((a, b) => b.day!.localeCompare(a.day!)) : entries;
}
