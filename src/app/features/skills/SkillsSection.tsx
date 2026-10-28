import React from 'react';
import { useI18n } from '@lib/i18n';

import { Block, Chip } from '../../components/Block';

export const SkillsSection: React.FC = () => {
    const { t, content } = useI18n();
    return (
        <Block id="skills" title={t('skills_title')}>
            <div className="grid gap-6 md:grid-cols-2">
                {content.skills.map((cat) => (
                    <div key={cat.name} className="space-y-2">
                        <h3 className="text-base text-ink">{cat.name}</h3>
                        <ul
                            className="flex flex-wrap gap-2"
                            aria-label={`${t('skills_list_prefix')} ${cat.name}`}
                        >
                            {cat.items.map((item) => (
                                <Chip key={item}>{item}</Chip>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Block>
    );
};
