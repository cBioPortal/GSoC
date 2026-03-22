import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import MutationMapperStore from '../../model/MutationMapperStore';
import { default as Track, TrackProps } from './Track';
import { TrackItemSpec } from './TrackItem';
import {
    Mutation,
    ExonDatum,
    extractExonInformation,
    formatExonLocation,
    formatExonLength,
} from 'cbioportal-utils';
import { EnsemblTranscript } from 'genome-nexus-ts-api-client';

type ExonTrackProps = TrackProps & {
    store: MutationMapperStore<Mutation>;
};

@observer
export default class ExonTrack extends React.Component<ExonTrackProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed get transcriptId(): string | undefined {
        return this.props.store.activeTranscript?.result;
    }

    @computed get transcript(): EnsemblTranscript | undefined {
        return this.transcriptId
            ? this.props.store.transcriptsByTranscriptId[this.transcriptId]
            : undefined;
    }

    @computed get chromosome(): string {
        return this.props.store.ensemblTranscriptLookUp.result?.body
            ?.seq_region_name;
    }

    @computed get genomeBuild(): string {
        return this.props.store.genomeBuild;
    }

    @computed get exonSpecs(): TrackItemSpec[] {
        if (!this.transcriptId || !this.transcript) {
            return [];
        }

        const exons = this.transcript!.exons;
        const utrs = this.transcript!.utrs || [];

        const exonInfo = exons
            ? extractExonInformation(exons, utrs, this.props.proteinLength)
            : undefined;

        const altColors = ['#007FFF', '#35BAF6'];

        return exonInfo
            ? exonInfo.map((exon: ExonDatum, index: number) => {
                  const startCodon = exon.start;
                  const endCodon = exon.start + exon.length;
                  const exonStartLocation = formatExonLocation(
                      startCodon,
                      index
                  );
                  const exonEndLocation = formatExonLocation(endCodon);
                  const exonLength = formatExonLength(exon.length);
                  const link = this.chromosome
                      ? `https://igv.org/app/?locus=chr${this.chromosome}:${exon.genomicLocationStart}-${exon.genomicLocationEnd}&genome=${this.genomeBuild}`
                      : 'https://igv.org';
                  const linkText = this.chromosome
                      ? `${this.genomeBuild}:chr${this.chromosome}:${exon.genomicLocationStart} - ${exon.genomicLocationEnd}`
                      : `${exon.genomicLocationStart} - ${exon.genomicLocationEnd}`;
                  return {
                      color: altColors[index % 2],
                      startCodon: startCodon,
                      endCodon: endCodon,
                      label: exon.rank.toString(),
                      labelColor: '#FFFFFF',
                      tooltip: (
                          <span>
                              <h5> Exon {exon.rank} </h5>
                              Start: Nucleotide{' '}
                              <strong>
                                  {exonStartLocation.nucleotideLocation}
                              </strong>{' '}
                              of amino acid{' '}
                              <strong>
                                  {exonStartLocation.aminoAcidLocation}
                              </strong>
                              <br></br>
                              End: Nucleotide{' '}
                              <strong>
                                  {exonEndLocation.nucleotideLocation}
                              </strong>{' '}
                              of amino acid{' '}
                              <strong>
                                  {exonEndLocation.aminoAcidLocation}
                              </strong>
                              <br></br>
                              Length:{' '}
                              <strong>{exonLength.aminoAcidLength}</strong>{' '}
                              amino acids{' '}
                              {exonLength.nucleotideLength && (
                                  <>
                                      {' '}
                                      and{' '}
                                      <strong>
                                          {exonLength.nucleotideLength}
                                      </strong>{' '}
                                      nucleotides
                                  </>
                              )}
                              <br></br>
                              Genomic location:
                              {` `}
                              <a
                                  target="_blank"
                                  href={link}
                                  rel="noopener noreferrer"
                              >
                                  <>
                                      {linkText}
                                      {` `}
                                      <i className="fa fa-external-link" />
                                  </>
                              </a>
                          </span>
                      ),
                  };
              })
            : [];
    }

    @computed get trackTitle() {
        return (
            <span>
                <span style={{ marginLeft: 16 }}></span>
                Exon
            </span>
        );
    }

    public render() {
        return (
            <Track
                dataStore={this.props.dataStore}
                width={this.props.width}
                xOffset={this.props.xOffset}
                proteinLength={this.props.proteinLength}
                trackTitle={this.trackTitle}
                trackItems={this.exonSpecs}
                idClassPrefix={'exon-'}
            />
        );
    }
}
