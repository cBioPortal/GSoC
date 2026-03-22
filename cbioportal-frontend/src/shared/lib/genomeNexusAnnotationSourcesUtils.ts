import { getServerConfig } from 'config/config';

export function shouldShowMutationAssessor() {
    return RegExp('mutation_assessor', 'gi').test(
        getServerConfig().show_genomenexus_annotation_sources
    );
}
