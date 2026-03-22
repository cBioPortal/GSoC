import { assert } from 'chai';
import { PtmType } from '../model/PostTranslationalModification';
import { UniprotFeature } from '../model/Uniprot';
import {
    compareByPtmTypePriority,
    convertDbPtmToPtm,
    convertUniprotFeatureToPtm,
    getPtmTypeFromUniprotFeature,
    getPubmedIdsFromUniprotFeature,
    groupPtmDataByPosition,
    groupPtmDataByTypeAndPosition,
    ptmColor,
} from './PtmUtils';

describe('PtmUtils', () => {
    const dbPtmData = [
        {
            // 0
            ensemblTranscriptIds: [],
            position: 0,
            pubmedIds: [],
            sequence: '',
            type: 'Acetylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 1
            ensemblTranscriptIds: [],
            position: 0,
            pubmedIds: [],
            sequence: '',
            type: 'Ubiquitination',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 2
            ensemblTranscriptIds: [],
            position: 1,
            pubmedIds: [],
            sequence: '',
            type: 'Ubiquitination',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 3
            ensemblTranscriptIds: [],
            position: 1,
            pubmedIds: [],
            sequence: '',
            type: 'Acetylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 4
            ensemblTranscriptIds: [],
            position: 1,
            pubmedIds: [],
            sequence: '',
            type: 'Phosphorylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 5
            ensemblTranscriptIds: [],
            position: 2,
            pubmedIds: [],
            sequence: '',
            type: 'Methylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 6
            ensemblTranscriptIds: [],
            position: 2,
            pubmedIds: [],
            sequence: '',
            type: 'Ubiquitination',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 7
            ensemblTranscriptIds: [],
            position: 2,
            pubmedIds: [],
            sequence: '',
            type: 'Glutathionylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
        {
            // 8
            ensemblTranscriptIds: [],
            position: 2,
            pubmedIds: [],
            sequence: '',
            type: 'Sumoylation',
            uniprotAccession: '',
            uniprotEntry: '',
        },
    ];

    const uniprotPtmData: UniprotFeature[] = [
        {
            // 0
            type: 'MOD_RES',
            category: 'PTM',
            description: 'N2-acetylarginine', // Acetylation
            begin: '0',
            end: '0',
            molecule: '',
            evidences: [],
        },
        {
            // 1
            type: 'CROSS_LINK',
            category: 'PTM',
            description: 'ubiquitin', // Ubiquitination
            begin: '0',
            end: '0',
            molecule: '',
            evidences: [],
        },
        {
            // 2
            type: 'CROSS_LINK',
            category: 'PTM',
            description: 'Ubiquitin', // Ubiquitination
            begin: '1',
            end: '1',
            molecule: '',
            evidences: [],
        },
        {
            // 3
            type: 'MOD_RES',
            category: 'PTM',
            description: 'N6-acetyllysine', // Acetylation
            begin: '1',
            end: '1',
            molecule: '',
            evidences: [],
        },
        {
            // 4
            type: 'MOD_RES',
            category: 'PTM',
            description: 'Phosphoserine', // Phosphorylation
            begin: '1',
            end: '1',
            molecule: '',
            evidences: [],
        },
        {
            // 5
            type: 'MOD_RES',
            category: 'PTM',
            description: 'Dimethylated arginine', // Methylation
            begin: '2',
            end: '2',
            molecule: '',
            evidences: [],
        },
        {
            // 6
            type: 'CROSS_LINK',
            category: 'PTM',
            description: 'ubiquitin', // Ubiquitination
            begin: '2',
            end: '2',
            molecule: '',
            evidences: [],
        },
        {
            // 7
            type: 'MOD_RES',
            category: 'PTM',
            description: 'Other', // Other
            begin: '2',
            end: '2',
            molecule: '',
            evidences: [],
        },
        {
            // 8
            type: 'MOD_RES',
            category: 'PTM',
            description: 'SUMO', // Sumoylation
            begin: '2',
            end: '2',
            molecule: '',
            evidences: [],
        },
    ];

    const partialUniprotPtm = [
        {
            type: 'MOD_RES',
            category: 'PTM',
            begin: '2',
            end: '2',
        },
    ];

    describe('convertToPtmData', () => {
        it('identically converts residues for both dbPTM and uniprotPTM data', () => {
            assert.deepEqual(
                dbPtmData.map(convertDbPtmToPtm).map(d => d.residue),
                uniprotPtmData
                    .map(convertUniprotFeatureToPtm)
                    .map(d => d.residue)
            );
        });
    });

    describe('compareByPtmTypePriority', () => {
        it('compares ptm types by priority', () => {
            assert.equal(
                compareByPtmTypePriority(
                    PtmType.Phosphorylation,
                    PtmType.Phosphorylation
                ),
                0,
                'identical strings should return 0'
            );
            assert.equal(
                compareByPtmTypePriority(
                    PtmType.Phosphorylation,
                    PtmType.Acetylation
                ),
                -1,
                'Phosphorylation has a higher priority than Acetylation'
            );
            assert.equal(
                compareByPtmTypePriority(
                    PtmType.Phosphorylation,
                    PtmType.Methylation
                ),
                -1,
                'Phosphorylation has a higher priority than Methylation'
            );
            assert.equal(
                compareByPtmTypePriority(
                    PtmType.Methylation,
                    PtmType.Acetylation
                ),
                1,
                'Methylation has a lower priority than Acetylation'
            );
            assert.equal(
                compareByPtmTypePriority(
                    PtmType.Ubiquitination,
                    PtmType.Sumoylation
                ),
                -1,
                'Ubiquitination has a higher priority than Sumoylation'
            );
            assert.equal(
                compareByPtmTypePriority('Unknown', PtmType.Sumoylation),
                1,
                'No priority defined for Unknown or Sumoylation, sort alphabetically'
            );
            assert.equal(
                compareByPtmTypePriority(
                    PtmType.Sumoylation,
                    PtmType.Sumoylation
                ),
                0
            );
        });
    });

    describe('groupPtmDataByPosition', () => {
        it('groups ptm data by position', () => {
            const ptmData = uniprotPtmData.map(convertUniprotFeatureToPtm);
            const grouped = groupPtmDataByPosition(ptmData);

            assert.equal(grouped[0].length, 2);
            assert.equal(grouped[1].length, 3);
            assert.equal(grouped[2].length, 4);
        });
    });

    describe('groupPtmDataByTypeAndPosition', () => {
        it('groups uniprot ptm data by type and position', () => {
            const ptmData = uniprotPtmData.map(convertUniprotFeatureToPtm);
            const grouped = groupPtmDataByTypeAndPosition(ptmData);

            assert.equal(grouped[PtmType.Acetylation][0].length, 1);
            assert.equal(grouped[PtmType.Acetylation][1].length, 1);
            assert.equal(grouped[PtmType.Ubiquitination][0].length, 1);
            assert.equal(grouped[PtmType.Ubiquitination][1].length, 1);
            assert.equal(grouped[PtmType.Ubiquitination][2].length, 1);
            assert.equal(grouped[PtmType.Phosphorylation][1].length, 1);
            assert.equal(grouped[PtmType.Methylation][2].length, 1);
            assert.equal(grouped[PtmType.Other][2].length, 1);
            assert.equal(grouped[PtmType.Sumoylation][2].length, 1);
        });

        it('groups dbPTM data by type and position', () => {
            const ptmData = dbPtmData.map(convertDbPtmToPtm);
            const grouped = groupPtmDataByTypeAndPosition(ptmData);

            assert.equal(grouped['Glutathionylation'][2].length, 1);
        });
    });

    describe('ptmColor', () => {
        it('picks the correct color for a list of PTMs', () => {
            const ptmData = uniprotPtmData.map(convertUniprotFeatureToPtm);

            assert.equal(
                ptmColor(ptmData),
                '#444444',
                'mixed PTM types should have a special color'
            );
            assert.equal(
                ptmColor([ptmData[4]]),
                '#2DCF00',
                'Phosphorylation: #2DCF00'
            );
            assert.equal(
                ptmColor([ptmData[0], ptmData[3]]),
                '#5B5BFF',
                'Acetylation: #5B5BFF'
            );
            assert.equal(
                ptmColor([ptmData[1], ptmData[2], ptmData[6]]),
                '#B9264F',
                'Ubiquitination: #B9264F'
            );
            assert.equal(
                ptmColor([ptmData[5]]),
                '#EBD61D',
                'Methylation: #EBD61D'
            );
            assert.equal(
                ptmColor([ptmData[7]]),
                '#BA21E0',
                'Glutathionylation (default): #BA21E0'
            );
            assert.equal(
                ptmColor([ptmData[8]]),
                '#BA21E0',
                'Sumoylation (default): #BA21E0'
            );
        });
    });
    describe('partial Uniprot data', () => {
        it('uses default ptm type when description is empty', () => {
            assert.equal(
                getPtmTypeFromUniprotFeature(partialUniprotPtm[0]),
                'Other',
                'Type should be "Other" if no "description" in data'
            );
        });
        it('returns no pubmed ids when evidence is empty', () => {
            assert.equal(
                getPubmedIdsFromUniprotFeature(partialUniprotPtm[0]).length,
                0,
                'No pubmed ids could be found if no "evidence" in data'
            );
        });
    });
});
