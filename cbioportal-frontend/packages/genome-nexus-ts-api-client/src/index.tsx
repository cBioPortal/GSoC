export * from './generated/Genome2StructureAPI';
export { default as Genome2StructureAPI } from './generated/Genome2StructureAPI';
export * from './generated/GenomeNexusAPI';
export { default as GenomeNexusAPI } from './generated/GenomeNexusAPI';
export {
    // only export default, otherwise we have namespace conflict with GenomeNexusAPI
    default as GenomeNexusAPIInternal,
} from './generated/GenomeNexusAPIInternal';
