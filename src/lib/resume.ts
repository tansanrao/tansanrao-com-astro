import resumeData from "../data/resume.json";

export interface ResumeProfile {
	network?: string;
	username?: string;
	url?: string;
}

export interface ResumeBasics {
	name: string;
	label?: string;
	image?: string;
	email?: string;
	phone?: string;
	url?: string;
	summary?: string;
	location?: {
		address?: string;
		postalCode?: string;
		city?: string;
		countryCode?: string;
		region?: string;
	};
	profiles?: ResumeProfile[];
}

export interface ResumeWork {
	name?: string;
	company?: string;
	position?: string;
	url?: string;
	location?: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	summary?: string;
	highlights?: string[];
}

export interface ResumeEducation {
	institution?: string;
	url?: string;
	area?: string;
	studyType?: string;
	location?: string;
	startDate?: string;
	endDate?: string;
	score?: string;
	courses?: string[];
}

export interface ResumePublication {
	name?: string;
	publisher?: string;
	releaseDate?: string;
	date?: string;
	url?: string;
	summary?: string;
}

export interface ResumeAward {
	title?: string;
	date?: string;
	awarder?: string;
	summary?: string;
}

export interface ResumeCertificate {
	name?: string;
	date?: string;
	issuer?: string;
	url?: string;
}

export interface ResumeSkill {
	name?: string;
	level?: string;
	keywords?: string[];
}

export interface ResumeLanguage {
	language?: string;
	fluency?: string;
}

export interface ResumeVolunteer {
	organization?: string;
	position?: string;
	url?: string;
	startDate?: string;
	endDate?: string;
	summary?: string;
	highlights?: string[];
}

export interface ResumeInterest {
	name?: string;
	keywords?: string[];
}

export interface ResumeReference {
	name?: string;
	reference?: string;
}

export interface ResumeProject {
	name?: string;
	description?: string;
	highlights?: string[];
	keywords?: string[];
	startDate?: string;
	endDate?: string;
	url?: string;
	roles?: string[];
	entity?: string;
	type?: string;
}

export interface Resume {
	basics: ResumeBasics;
	work?: ResumeWork[];
	volunteer?: ResumeVolunteer[];
	education?: ResumeEducation[];
	awards?: ResumeAward[];
	certificates?: ResumeCertificate[];
	publications?: ResumePublication[];
	skills?: ResumeSkill[];
	languages?: ResumeLanguage[];
	interests?: ResumeInterest[];
	references?: ResumeReference[];
	projects?: ResumeProject[];
}

export const resume = resumeData as Resume;

export function hasText(value?: string | null) {
	return Boolean(value?.trim());
}

export function hasItems<T>(items?: T[] | null): items is T[] {
	return Boolean(items?.length);
}

export function formatDate(value?: string) {
	if (!value?.trim()) return "";
	if (value.toLowerCase() === "present") return "Present";

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;

	return new Intl.DateTimeFormat("en", {
		month: "short",
		year: "numeric",
		timeZone: "UTC"
	}).format(date);
}

export function formatDateRange(startDate?: string, endDate?: string) {
	const start = formatDate(startDate);
	const end = hasText(endDate) ? formatDate(endDate) : "Present";

	if (start && end) return `${start} - ${end}`;
	if (start) return start;
	return end === "Present" ? "" : end;
}

export function joinParts(parts: Array<string | undefined | null>) {
	return parts.filter(hasText).join(", ");
}
