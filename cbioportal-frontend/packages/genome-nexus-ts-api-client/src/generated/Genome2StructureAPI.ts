import * as request from "superagent";

type CallbackHandler = (err: any, res ? : request.Response) => void;
export type Alignment = {
    'alignmentId': number

        'bitscore': number

        'chain': string

        'evalue': string

        'identity': number

        'identityPositive': number

        'midlineAlign': string

        'pdbAlign': string

        'pdbFrom': number

        'pdbId': string

        'pdbNo': string

        'pdbSeg': string

        'pdbTo': number

        'residueMapping': Array < ResidueMapping >

        'segStart': string

        'seqAlign': string

        'seqFrom': number

        'seqId': string

        'seqTo': number

        'updateDate': string

};
export type ResidueMapping = {
    'pdbAminoAcid': string

        'pdbPosition': number

        'queryAminoAcid': string

        'queryPosition': number

};

/**
 * A Genome to Strucure (G2S) API Supports Automated Mapping and Annotating Genomic Variants in 3D Protein Structures. Supports Inputs from Human Genome Position, Uniprot and Human Ensembl Names.
 * @class Genome2StructureAPI
 * @param {(string)} [domainOrOptions] - The project domain.
 */
export default class Genome2StructureAPI {

    private domain: string = "";
    private errorHandlers: CallbackHandler[] = [];

    constructor(domain ? : string) {
        if (domain) {
            this.domain = domain;
        }
    }

    getDomain() {
        return this.domain;
    }

    addErrorHandler(handler: CallbackHandler) {
        this.errorHandlers.push(handler);
    }

    private request(method: string, url: string, body: any, headers: any, queryParameters: any, form: any, reject: CallbackHandler, resolve: CallbackHandler, errorHandlers: CallbackHandler[]) {
        let req = (new(request as any).Request(method, url) as request.Request)
            .query(queryParameters);
        Object.keys(headers).forEach(key => {
            req.set(key, headers[key]);
        });

        if (body) {
            req.send(body);
        }

        if (typeof(body) === 'object' && !(body.constructor.name === 'Buffer')) {
            req.set('Content-Type', 'application/json');
        }

        if (Object.keys(form).length > 0) {
            req.type('form');
            req.send(form);
        }

        req.end((error, response) => {
            if (error || !response.ok) {
                reject(error);
                errorHandlers.forEach(handler => handler(error));
            } else {
                resolve(response);
            }
        });
    }

    getPdbAlignmentBySequenceUsingGETURL(parameters: {
        'sequence': string,
        'paramList' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments';
        if (parameters['sequence'] !== undefined) {
            queryParameters['sequence'] = parameters['sequence'];
        }

        if (parameters['paramList'] !== undefined) {
            queryParameters['paramList'] = parameters['paramList'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * Get PDB Alignments by Protein Sequence
    * @method
    * @name Genome2StructureAPI#getPdbAlignmentBySequenceUsingGET
         * @param {string} sequence - Input Protein Sequence: ETGQSVNDPGNMSFVKETVDKLLKGYDIRLRPDFGGPP
         * @param {array} paramList - Default Blast Parameters:
     Evalue=1e-10,Wordsize=3,Gapopen=11,Gapextend=1,
     Matrix=BLOSUM62,Comp_based_stats=2,
    Threshold=11,Windowsize=40
    */
    getPdbAlignmentBySequenceUsingGET(parameters: {
            'sequence': string,
            'paramList' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['sequence'] !== undefined) {
                    queryParameters['sequence'] = parameters['sequence'];
                }

                if (parameters['sequence'] === undefined) {
                    reject(new Error('Missing required  parameter: sequence'));
                    return;
                }

                if (parameters['paramList'] !== undefined) {
                    queryParameters['paramList'] = parameters['paramList'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    getPdbAlignmentBySequenceUsingPOSTURL(parameters: {
        'sequence': string,
        'paramList' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments';
        if (parameters['sequence'] !== undefined) {
            queryParameters['sequence'] = parameters['sequence'];
        }

        if (parameters['paramList'] !== undefined) {
            queryParameters['paramList'] = parameters['paramList'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * Get PDB Alignments by Protein Sequence
    * @method
    * @name Genome2StructureAPI#getPdbAlignmentBySequenceUsingPOST
         * @param {string} sequence - Input Protein Sequence: ETGQSVNDPGNMSFVKETVDKLLKGYDIRLRPDFGGPP
         * @param {array} paramList - Default Blast Parameters:
     Evalue=1e-10,Wordsize=3,Gapopen=11,Gapextend=1,
     Matrix=BLOSUM62,Comp_based_stats=2,
    Threshold=11,Windowsize=40
    */
    getPdbAlignmentBySequenceUsingPOST(parameters: {
            'sequence': string,
            'paramList' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['sequence'] !== undefined) {
                    queryParameters['sequence'] = parameters['sequence'];
                }

                if (parameters['sequence'] === undefined) {
                    reject(new Error('Missing required  parameter: sequence'));
                    return;
                }

                if (parameters['paramList'] !== undefined) {
                    queryParameters['paramList'] = parameters['paramList'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    getPdbAlignmentReisudeBySequenceUsingGETURL(parameters: {
        'sequence': string,
        'positionList' ? : Array < string > ,
        'paramList' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments/residueMapping';
        if (parameters['sequence'] !== undefined) {
            queryParameters['sequence'] = parameters['sequence'];
        }

        if (parameters['positionList'] !== undefined) {
            queryParameters['positionList'] = parameters['positionList'];
        }

        if (parameters['paramList'] !== undefined) {
            queryParameters['paramList'] = parameters['paramList'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * Get PDB Residue Mapping by Protein Sequence and Residue position
    * @method
    * @name Genome2StructureAPI#getPdbAlignmentReisudeBySequenceUsingGET
         * @param {string} sequence - Input Protein Sequence: ETGQSVNDPGNMSFVKETVDKLLKGYDIRLRPDFGGPP
         * @param {array} positionList - Input Residue Positions e.g. 10,20
         * @param {array} paramList - Default Blast Parameters:
     Evalue=1e-10,Wordsize=3,Gapopen=11,Gapextend=1,
     Matrix=BLOSUM62,Comp_based_stats=2,
    Threshold=11,Windowsize=40
    */
    getPdbAlignmentReisudeBySequenceUsingGET(parameters: {
            'sequence': string,
            'positionList' ? : Array < string > ,
            'paramList' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments/residueMapping';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['sequence'] !== undefined) {
                    queryParameters['sequence'] = parameters['sequence'];
                }

                if (parameters['sequence'] === undefined) {
                    reject(new Error('Missing required  parameter: sequence'));
                    return;
                }

                if (parameters['positionList'] !== undefined) {
                    queryParameters['positionList'] = parameters['positionList'];
                }

                if (parameters['paramList'] !== undefined) {
                    queryParameters['paramList'] = parameters['paramList'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    getPdbAlignmentReisudeBySequenceUsingPOSTURL(parameters: {
        'sequence': string,
        'positionList' ? : Array < string > ,
        'paramList' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments/residueMapping';
        if (parameters['sequence'] !== undefined) {
            queryParameters['sequence'] = parameters['sequence'];
        }

        if (parameters['positionList'] !== undefined) {
            queryParameters['positionList'] = parameters['positionList'];
        }

        if (parameters['paramList'] !== undefined) {
            queryParameters['paramList'] = parameters['paramList'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * Get PDB Residue Mapping by Protein Sequence and Residue position
    * @method
    * @name Genome2StructureAPI#getPdbAlignmentReisudeBySequenceUsingPOST
         * @param {string} sequence - Input Protein Sequence: ETGQSVNDPGNMSFVKETVDKLLKGYDIRLRPDFGGPP
         * @param {array} positionList - Input Residue Positions e.g. 10,20
         * @param {array} paramList - Default Blast Parameters:
     Evalue=1e-10,Wordsize=3,Gapopen=11,Gapextend=1,
     Matrix=BLOSUM62,Comp_based_stats=2,
    Threshold=11,Windowsize=40
    */
    getPdbAlignmentReisudeBySequenceUsingPOST(parameters: {
            'sequence': string,
            'positionList' ? : Array < string > ,
            'paramList' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments/residueMapping';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                if (parameters['sequence'] !== undefined) {
                    queryParameters['sequence'] = parameters['sequence'];
                }

                if (parameters['sequence'] === undefined) {
                    reject(new Error('Missing required  parameter: sequence'));
                    return;
                }

                if (parameters['positionList'] !== undefined) {
                    queryParameters['positionList'] = parameters['positionList'];
                }

                if (parameters['paramList'] !== undefined) {
                    queryParameters['paramList'] = parameters['paramList'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    getAlignmentUsingGETURL(parameters: {
        'idType': string,
        'id': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments/{id_type}/{id}';

        path = path.replace('{id_type}', parameters['idType'] + '');

        path = path.replace('{id}', parameters['id'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * Get PDB Alignments by ProteinId
    * @method
    * @name Genome2StructureAPI#getAlignmentUsingGET
         * @param {string} idType - Input id_type: ensembl; uniprot; uniprot_isoform
         * @param {string} id - Input id e.g.
    ensembl:ENSP00000484409.1/ENSG00000141510.16/ENST00000504290.5; uniprot:P04637/P53_HUMAN; uniprot_isoform:P04637_9/P53_HUMAN_9 
    */
    getAlignmentUsingGET(parameters: {
            'idType': string,
            'id': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments/{id_type}/{id}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{id_type}', parameters['idType'] + '');

                if (parameters['idType'] === undefined) {
                    reject(new Error('Missing required  parameter: idType'));
                    return;
                }

                path = path.replace('{id}', parameters['id'] + '');

                if (parameters['id'] === undefined) {
                    reject(new Error('Missing required  parameter: id'));
                    return;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    getAlignmentByPDBUsingGETURL(parameters: {
        'idType': string,
        'id': string,
        'pdbId': string,
        'chainId': string,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments/{id_type}/{id}/pdb/{pdb_id}_{chain_id}';

        path = path.replace('{id_type}', parameters['idType'] + '');

        path = path.replace('{id}', parameters['id'] + '');

        path = path.replace('{pdb_id}', parameters['pdbId'] + '');

        path = path.replace('{chain_id}', parameters['chainId'] + '');

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * Get PDB Alignments by ProteinId, PDBId and Chain
    * @method
    * @name Genome2StructureAPI#getAlignmentByPDBUsingGET
         * @param {string} idType - Input id_type: ensembl; uniprot; uniprot_isoform
         * @param {string} id - Input id e.g.
    ensembl:ENSP00000484409.1/ENSG00000141510.16/ENST00000504290.5; uniprot:P04637/P53_HUMAN; uniprot_isoform:P04637_9/P53_HUMAN_9 
         * @param {string} pdbId - Input PDB Id e.g. 2fej
         * @param {string} chainId - Input Chain e.g. A
    */
    getAlignmentByPDBUsingGET(parameters: {
            'idType': string,
            'id': string,
            'pdbId': string,
            'chainId': string,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments/{id_type}/{id}/pdb/{pdb_id}_{chain_id}';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{id_type}', parameters['idType'] + '');

                if (parameters['idType'] === undefined) {
                    reject(new Error('Missing required  parameter: idType'));
                    return;
                }

                path = path.replace('{id}', parameters['id'] + '');

                if (parameters['id'] === undefined) {
                    reject(new Error('Missing required  parameter: id'));
                    return;
                }

                path = path.replace('{pdb_id}', parameters['pdbId'] + '');

                if (parameters['pdbId'] === undefined) {
                    reject(new Error('Missing required  parameter: pdbId'));
                    return;
                }

                path = path.replace('{chain_id}', parameters['chainId'] + '');

                if (parameters['chainId'] === undefined) {
                    reject(new Error('Missing required  parameter: chainId'));
                    return;
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    postResidueMappingByPDBUsingGETURL(parameters: {
        'idType': string,
        'id': string,
        'pdbId': string,
        'chainId': string,
        'positionList' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments/{id_type}/{id}/pdb/{pdb_id}_{chain_id}/residueMapping';

        path = path.replace('{id_type}', parameters['idType'] + '');

        path = path.replace('{id}', parameters['id'] + '');

        path = path.replace('{pdb_id}', parameters['pdbId'] + '');

        path = path.replace('{chain_id}', parameters['chainId'] + '');
        if (parameters['positionList'] !== undefined) {
            queryParameters['positionList'] = parameters['positionList'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * Post Residue Mapping by ProteinId, PDBId and Chain
    * @method
    * @name Genome2StructureAPI#postResidueMappingByPDBUsingGET
         * @param {string} idType - Input id_type: ensembl; uniprot; uniprot_isoform; hgvs; hgvs38
         * @param {string} id - Input id e.g. 
    ensembl:ENSP00000484409.1/ENSG00000141510.16/ENST00000504290.5;
    uniprot:P04637/P53_HUMAN;
    uniprot_isoform:P04637_9/P53_HUMAN_9;
    hgvs:17:g.79478130C>G;
    hgvs38:17:g.7676594T>G
         * @param {string} pdbId - Input PDB Id e.g. 2fej
         * @param {string} chainId - Input Chain e.g. A
         * @param {array} positionList - Input Residue Positions e.g. 10,100 (Anynumber for hgvs);
    Return all residue mappings if none
    */
    postResidueMappingByPDBUsingGET(parameters: {
            'idType': string,
            'id': string,
            'pdbId': string,
            'chainId': string,
            'positionList' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments/{id_type}/{id}/pdb/{pdb_id}_{chain_id}/residueMapping';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{id_type}', parameters['idType'] + '');

                if (parameters['idType'] === undefined) {
                    reject(new Error('Missing required  parameter: idType'));
                    return;
                }

                path = path.replace('{id}', parameters['id'] + '');

                if (parameters['id'] === undefined) {
                    reject(new Error('Missing required  parameter: id'));
                    return;
                }

                path = path.replace('{pdb_id}', parameters['pdbId'] + '');

                if (parameters['pdbId'] === undefined) {
                    reject(new Error('Missing required  parameter: pdbId'));
                    return;
                }

                path = path.replace('{chain_id}', parameters['chainId'] + '');

                if (parameters['chainId'] === undefined) {
                    reject(new Error('Missing required  parameter: chainId'));
                    return;
                }

                if (parameters['positionList'] !== undefined) {
                    queryParameters['positionList'] = parameters['positionList'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    postResidueMappingByPDBUsingPOSTURL(parameters: {
        'idType': string,
        'id': string,
        'pdbId': string,
        'chainId': string,
        'positionList' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments/{id_type}/{id}/pdb/{pdb_id}_{chain_id}/residueMapping';

        path = path.replace('{id_type}', parameters['idType'] + '');

        path = path.replace('{id}', parameters['id'] + '');

        path = path.replace('{pdb_id}', parameters['pdbId'] + '');

        path = path.replace('{chain_id}', parameters['chainId'] + '');
        if (parameters['positionList'] !== undefined) {
            queryParameters['positionList'] = parameters['positionList'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * Post Residue Mapping by ProteinId, PDBId and Chain
    * @method
    * @name Genome2StructureAPI#postResidueMappingByPDBUsingPOST
         * @param {string} idType - Input id_type: ensembl; uniprot; uniprot_isoform; hgvs; hgvs38
         * @param {string} id - Input id e.g. 
    ensembl:ENSP00000484409.1/ENSG00000141510.16/ENST00000504290.5;
    uniprot:P04637/P53_HUMAN;
    uniprot_isoform:P04637_9/P53_HUMAN_9;
    hgvs:17:g.79478130C>G;
    hgvs38:17:g.7676594T>G
         * @param {string} pdbId - Input PDB Id e.g. 2fej
         * @param {string} chainId - Input Chain e.g. A
         * @param {array} positionList - Input Residue Positions e.g. 10,100 (Anynumber for hgvs);
    Return all residue mappings if none
    */
    postResidueMappingByPDBUsingPOST(parameters: {
            'idType': string,
            'id': string,
            'pdbId': string,
            'chainId': string,
            'positionList' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments/{id_type}/{id}/pdb/{pdb_id}_{chain_id}/residueMapping';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{id_type}', parameters['idType'] + '');

                if (parameters['idType'] === undefined) {
                    reject(new Error('Missing required  parameter: idType'));
                    return;
                }

                path = path.replace('{id}', parameters['id'] + '');

                if (parameters['id'] === undefined) {
                    reject(new Error('Missing required  parameter: id'));
                    return;
                }

                path = path.replace('{pdb_id}', parameters['pdbId'] + '');

                if (parameters['pdbId'] === undefined) {
                    reject(new Error('Missing required  parameter: pdbId'));
                    return;
                }

                path = path.replace('{chain_id}', parameters['chainId'] + '');

                if (parameters['chainId'] === undefined) {
                    reject(new Error('Missing required  parameter: chainId'));
                    return;
                }

                if (parameters['positionList'] !== undefined) {
                    queryParameters['positionList'] = parameters['positionList'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    postResidueMappingUsingGETURL(parameters: {
        'idType': string,
        'id': string,
        'positionList' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments/{id_type}/{id}/residueMapping';

        path = path.replace('{id_type}', parameters['idType'] + '');

        path = path.replace('{id}', parameters['id'] + '');
        if (parameters['positionList'] !== undefined) {
            queryParameters['positionList'] = parameters['positionList'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * POST PDB Residue Mapping by ProteinId
    * @method
    * @name Genome2StructureAPI#postResidueMappingUsingGET
         * @param {string} idType - Input id_type: ensembl; uniprot;
    uniprot_isoform; hgvs; hgvs38
         * @param {string} id - Input id e.g.
    ensembl:ENSP00000484409.1/ENSG00000141510.16/ENST00000504290.5;
    uniprot:P04637/P53_HUMAN;
    uniprot_isoform:P04637_9/P53_HUMAN_9;
    hgvs:17:g.79478130C>G;
    hgvs38:17:g.7676594T>G
         * @param {array} positionList - Input Residue Positions e.g. 10,100; Anynumber for hgvs;
    Return all residue mappings if none
    */
    postResidueMappingUsingGET(parameters: {
            'idType': string,
            'id': string,
            'positionList' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments/{id_type}/{id}/residueMapping';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{id_type}', parameters['idType'] + '');

                if (parameters['idType'] === undefined) {
                    reject(new Error('Missing required  parameter: idType'));
                    return;
                }

                path = path.replace('{id}', parameters['id'] + '');

                if (parameters['id'] === undefined) {
                    reject(new Error('Missing required  parameter: id'));
                    return;
                }

                if (parameters['positionList'] !== undefined) {
                    queryParameters['positionList'] = parameters['positionList'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('GET', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

    postResidueMappingUsingPOSTURL(parameters: {
        'idType': string,
        'id': string,
        'positionList' ? : Array < string > ,
        $queryParameters ? : any
    }): string {
        let queryParameters: any = {};
        let path = '/api/alignments/{id_type}/{id}/residueMapping';

        path = path.replace('{id_type}', parameters['idType'] + '');

        path = path.replace('{id}', parameters['id'] + '');
        if (parameters['positionList'] !== undefined) {
            queryParameters['positionList'] = parameters['positionList'];
        }

        if (parameters.$queryParameters) {
            Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                var parameter = parameters.$queryParameters[parameterName];
                queryParameters[parameterName] = parameter;
            });
        }
        let keys = Object.keys(queryParameters);
        return this.domain + path + (keys.length > 0 ? '?' + (keys.map(key => key + '=' + encodeURIComponent(queryParameters[key])).join('&')) : '');
    };

    /**
    * POST PDB Residue Mapping by ProteinId
    * @method
    * @name Genome2StructureAPI#postResidueMappingUsingPOST
         * @param {string} idType - Input id_type: ensembl; uniprot;
    uniprot_isoform; hgvs; hgvs38
         * @param {string} id - Input id e.g.
    ensembl:ENSP00000484409.1/ENSG00000141510.16/ENST00000504290.5;
    uniprot:P04637/P53_HUMAN;
    uniprot_isoform:P04637_9/P53_HUMAN_9;
    hgvs:17:g.79478130C>G;
    hgvs38:17:g.7676594T>G
         * @param {array} positionList - Input Residue Positions e.g. 10,100; Anynumber for hgvs;
    Return all residue mappings if none
    */
    postResidueMappingUsingPOST(parameters: {
            'idType': string,
            'id': string,
            'positionList' ? : Array < string > ,
            $queryParameters ? : any,
            $domain ? : string
        }): Promise < Array < Alignment >
        > {
            const domain = parameters.$domain ? parameters.$domain : this.domain;
            const errorHandlers = this.errorHandlers;
            const request = this.request;
            let path = '/api/alignments/{id_type}/{id}/residueMapping';
            let body: any;
            let queryParameters: any = {};
            let headers: any = {};
            let form: any = {};
            return new Promise(function(resolve, reject) {
                headers['Accept'] = 'application/json';
                headers['Content-Type'] = 'application/json';

                path = path.replace('{id_type}', parameters['idType'] + '');

                if (parameters['idType'] === undefined) {
                    reject(new Error('Missing required  parameter: idType'));
                    return;
                }

                path = path.replace('{id}', parameters['id'] + '');

                if (parameters['id'] === undefined) {
                    reject(new Error('Missing required  parameter: id'));
                    return;
                }

                if (parameters['positionList'] !== undefined) {
                    queryParameters['positionList'] = parameters['positionList'];
                }

                if (parameters.$queryParameters) {
                    Object.keys(parameters.$queryParameters).forEach(function(parameterName) {
                        var parameter = parameters.$queryParameters[parameterName];
                        queryParameters[parameterName] = parameter;
                    });
                }

                request('POST', domain + path, body, headers, queryParameters, form, reject, resolve, errorHandlers);

            }).then(function(response: request.Response) {
                return response.body;
            });
        };

}