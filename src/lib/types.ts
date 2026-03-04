export interface Project {
    id: string;
    title: string;
    company: string;
    repositoryUrl?: string;
    liveUrl?: string;
    description: string;
    role: string;
    contributions: string[];
    tech: string[];
    years: string;
    images: string[];
}
