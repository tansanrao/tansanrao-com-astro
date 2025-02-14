export interface TocHeading {
    depth: number;
    text: string;
    slug: string;
    subheadings: TocHeading[];
  } 