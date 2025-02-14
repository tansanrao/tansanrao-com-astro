import { defineCollection, z } from 'astro:content';


const authorSchema = z.object({
    name: z.string(),
    url: z.string().url().optional()
});

const footnoteSchema = z.object({
    id: z.string(),
    content: z.string()
});

const blogCollection = defineCollection({
    type: 'content',
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            description: z.string(),
            pubDate: z.date(),
            updatedDate: z.date().optional(),
            heroImage: image().optional(),
            tags: z.array(z.string()).default([]),
            draft: z.boolean().default(false),
            featured: z.boolean().default(false),
            authors: z
                .array(authorSchema)
                .default([{ name: 'Tanuj Ravi Rao', url: 'https://tansanrao.com' }]),
            readingTime: z.string().optional(),
            footnotes: z.array(footnoteSchema).optional()
        })
});

const newsCollection = defineCollection({
    type: 'content',
    schema: () =>
        z.object({
            pubDate: z.date(),
            draft: z.boolean().default(false)
        })
});

const notesCollection = defineCollection({
    type: 'content',
    schema: ({ image }) =>
        z.object({
            title: z.string(),
            pubDate: z.date(),
            updatedDate: z.date().optional(),
            draft: z.boolean().default(false),
            tags: z.array(z.string()).default([]),
            heroImage: image().optional(),
            authors: z
                .array(authorSchema)
                .default([{ name: 'Tanuj Ravi Rao', url: 'https://tansanrao.com' }]),
            footnotes: z.array(footnoteSchema).optional()
        })
});

// JSON Resume schemas
const locationSchema = z.object({
    address: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    countryCode: z.string().optional(),
    region: z.string().optional()
});

const profileSchema = z.object({
    network: z.string(),
    username: z.string(),
    url: z.string().url().optional()
});

const basicsSchema = z.object({
    name: z.string(),
    label: z.string(),
    image: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    url: z.string().url(),
    summary: z.string(),
    location: locationSchema.optional(),
    profiles: z.array(profileSchema).optional()
});

const workSchema = z.object({
    company: z.string(),
    position: z.string(),
    url: z.string().url().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    summary: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    location: z.string().optional()
});

const volunteerSchema = z.object({
    organization: z.string(),
    position: z.string(),
    url: z.string().url().optional(),
    startDate: z.string(),
    endDate: z.string().optional(),
    summary: z.string().optional(),
    highlights: z.array(z.string()).optional()
});

const educationSchema = z.object({
    institution: z.string(),
    url: z.string().url().optional(),
    area: z.string(),
    studyType: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    score: z.string().optional(),
    courses: z.array(z.string()).optional(),
    location: z.string().optional()
});

const awardSchema = z.object({
    title: z.string(),
    date: z.string(),
    awarder: z.string(),
    summary: z.string().optional()
});

const certificateSchema = z.object({
    name: z.string(),
    date: z.string(),
    issuer: z.string(),
    url: z.string().url().optional()
});

const publicationSchema = z.object({
    name: z.string(),
    publisher: z.string(),
    date: z.string(),
    url: z.string().url().optional(),
    summary: z.string().optional()
});

const skillSchema = z.object({
    name: z.string(),
    level: z.string().optional(),
    keywords: z.array(z.string()).optional()
});

const languageSchema = z.object({
    language: z.string(),
    fluency: z.string().optional()
});

const interestSchema = z.object({
    name: z.string(),
    keywords: z.array(z.string()).optional()
});

const referenceSchema = z.object({
    name: z.string(),
    reference: z.string()
});

const projectSchema = z.object({
    name: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    description: z.string().optional(),
    highlights: z.array(z.string()).optional(),
    url: z.string().url().optional()
});

const resumeCollection = defineCollection({
    type: 'data',
    schema: z.object({
        basics: basicsSchema,
        work: z.array(workSchema).optional(),
        volunteer: z.array(volunteerSchema).optional(),
        education: z.array(educationSchema).optional(),
        awards: z.array(awardSchema).optional(),
        certificates: z.array(certificateSchema).optional(),
        publications: z.array(publicationSchema).optional(),
        skills: z.array(skillSchema).optional(),
        languages: z.array(languageSchema).optional(),
        interests: z.array(interestSchema).optional(),
        references: z.array(referenceSchema).optional(),
        projects: z.array(projectSchema).optional()
    })
});

export const collections = {
    blog: blogCollection,
    news: newsCollection,
    notes: notesCollection,
    resume: resumeCollection
}; 