import { box, canvas, colors, renderImage, space, titleBlock, typography } from ".";

export default async ({ type, author, domain, title, time }: { type: string; author: string; domain: string; title: string; time?: string }) => {
	const width = 1200 - space(16) * 2;
	return renderImage(
		canvas([
			box({ alignItems: "center", justifyContent: "space-between", paddingBottom: space(8), borderBottom: `1px solid ${colors.line}` }, [
				box(typography("identity"), author),
				box({ ...typography("meta"), color: colors.muted }, domain)
			]),
			box({ flexGrow: 1, flexDirection: "column", justifyContent: "center" }, [await titleBlock(title, width, 320)]),
			box({ ...typography("meta"), justifyContent: "space-between", alignItems: "center" }, [
				box({ color: colors.accent }, type),
				...(time ? [box({ color: colors.muted }, time)] : [])
			])
		])
	);
};
