// CV en PDF, generado en el build con @react-pdf/renderer desde el mismo contenido del sitio.
// Una columna y texto real para que lo lean los ATS.
import path from 'node:path';

import React from 'react';
import {
    Document,
    Font,
    Link,
    Page,
    StyleSheet,
    Text,
    View,
    renderToBuffer,
} from '@react-pdf/renderer';

import { cvData, type CvData } from './cv-data';

import type { Locale } from '@/content';

const fontFile = (pkg: string, file: string) =>
    path.resolve(process.cwd(), 'node_modules', '@fontsource', pkg, 'files', file);

Font.register({
    family: 'Space Grotesk',
    src: fontFile('space-grotesk', 'space-grotesk-latin-700-normal.woff'),
    fontWeight: 700,
});
Font.register({
    family: 'Inter',
    fonts: [
        { src: fontFile('inter', 'inter-latin-400-normal.woff'), fontWeight: 400 },
        {
            src: fontFile('inter', 'inter-latin-400-italic.woff'),
            fontWeight: 400,
            fontStyle: 'italic',
        },
        { src: fontFile('inter', 'inter-latin-700-normal.woff'), fontWeight: 700 },
    ],
});
// Sin guiones de separación silábica: cortan nombres de tecnologías.
Font.registerHyphenationCallback((word) => [word]);

const VERDE_AVILA = '#2f6b4f';
const TEXT = '#14231c';
const MUTED = '#4b5d55';

const s = StyleSheet.create({
    page: { fontFamily: 'Inter', fontSize: 9.5, color: TEXT, padding: 36, lineHeight: 1.35 },
    name: { fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, lineHeight: 1.2 },
    role: { fontSize: 11, color: VERDE_AVILA, marginTop: 4 },
    contacts: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, color: MUTED },
    contact: { color: MUTED, textDecoration: 'none' },
    separator: { marginHorizontal: 6 },
    heading: {
        fontFamily: 'Space Grotesk',
        fontWeight: 700,
        fontSize: 11.5,
        marginTop: 12,
        marginBottom: 5,
        paddingBottom: 2,
        borderBottomWidth: 1.2,
        borderBottomColor: VERDE_AVILA,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    strong: { fontWeight: 700 },
    muted: { color: MUTED },
    italic: { fontStyle: 'italic', color: MUTED },
    item: { marginBottom: 7 },
    bullet: { flexDirection: 'row', marginTop: 1.5 },
    bulletMark: { width: 10, color: VERDE_AVILA },
    bulletText: { flex: 1 },
    link: { color: VERDE_AVILA },
});

const Bullet: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={s.bullet}>
        <Text style={s.bulletMark}>•</Text>
        <Text style={s.bulletText}>{children}</Text>
    </View>
);

const CvDocument: React.FC<{ cv: CvData }> = ({ cv }) => (
    <Document title={`CV · ${cv.header.fullName}`} author={cv.header.fullName} language={cv.locale}>
        <Page size="A4" style={s.page}>
            <Text style={s.name}>{cv.header.fullName}</Text>
            <Text style={s.role}>{cv.header.role}</Text>
            <View style={s.contacts}>
                {cv.header.contacts.map((c, i) => (
                    <View key={c.url} style={{ flexDirection: 'row' }}>
                        {i > 0 && <Text style={s.separator}>·</Text>}
                        <Link src={c.url} style={s.contact}>
                            {c.label}
                        </Link>
                    </View>
                ))}
            </View>

            <Text style={s.heading}>{cv.headings.summary}</Text>
            <Text>{cv.summary}</Text>

            <Text style={s.heading}>{cv.headings.experience}</Text>
            {cv.experiences.map((e) => (
                <View key={e.company} style={s.item}>
                    <View wrap={false}>
                        <View style={s.row}>
                            <Text style={s.strong}>
                                {e.role} · {e.company}
                            </Text>
                            <Text style={s.italic}>{e.period}</Text>
                        </View>
                        <Text style={s.muted}>
                            {e.location}
                            {e.projects.length > 0 ? ` · ${e.projects.join(', ')}` : ''}
                        </Text>
                        {e.achievements[0] && <Bullet>{e.achievements[0]}</Bullet>}
                    </View>
                    {e.achievements.slice(1).map((a) => (
                        <Bullet key={a}>{a}</Bullet>
                    ))}
                </View>
            ))}

            {/* Sección corta: no se parte entre páginas, así el título no queda solo. */}
            <View wrap={false}>
                <Text style={s.heading}>{cv.headings.projects}</Text>
                {cv.featuredProjects.map((p) => (
                    <View key={p.url} style={s.item} wrap={false}>
                        <Link src={p.url} style={[s.strong, s.link]}>
                            {p.title}
                        </Link>
                        <Text>{p.summary}</Text>
                    </View>
                ))}
            </View>
            {/* Sección corta: no se parte entre páginas, así el título no queda solo. */}
            <View wrap={false}>
                <Text style={s.heading}>{cv.headings.education}</Text>
                {cv.education.map((e) => (
                    <View key={e.institution} style={[s.row, s.item]} wrap={false}>
                        <Text>
                            <Text style={s.strong}>{e.institution}</Text> · {e.title} · {e.location}
                        </Text>
                        <Text style={s.italic}>{e.period}</Text>
                    </View>
                ))}
            </View>
            {/* Sección corta: no se parte entre páginas, así el título no queda solo. */}
            <View wrap={false}>
                <Text style={s.heading}>{cv.headings.skills}</Text>
                {cv.skills.map((k) => (
                    <Text key={k.name} style={{ marginBottom: 2 }}>
                        <Text style={s.strong}>{k.name}: </Text>
                        {k.items.join(', ')}
                    </Text>
                ))}
            </View>
        </Page>
    </Document>
);

export async function renderCv(locale: Locale, today: Date, siteUrl: string): Promise<Buffer> {
    return renderToBuffer(<CvDocument cv={cvData(locale, today, siteUrl)} />);
}

/** Cuenta los objetos /Type /Page (no /Pages) del PDF. */
export function countPdfPages(pdf: Buffer): number {
    return pdf.toString('latin1').match(/\/Type\s*\/Page(?!s)/g)?.length ?? 0;
}
