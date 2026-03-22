start
    = Query
    / sp { return false; }

NaturalNumber = number:[0-9]+ { return number.join("");}
Number = "-" number: Number { return "-"+number;}
        / whole_part:NaturalNumber "." decimal_part:NaturalNumber { return whole_part + "." + decimal_part;}
        / "." decimal_part:NaturalNumber { return "."+decimal_part;}
        / whole_part:NaturalNumber {return whole_part;}
String = word:[-_.@/a-zA-Z0-9*]+ { return word.join("") }
AlphaNumeric = word:[a-zA-Z0-9]+ { return word.join("") }
MutationProteinChangeCodeChar = char:[-_./a-zA-Z0-9*] { return char; }
AminoAcid = letter:[GPAVLIMCFYWHKRQNEDST] { return letter; }
// any character, except " :
StringExceptQuotes = stringExceptQuotes:[^"]+ { return stringExceptQuotes.join("") }

sp = space:[ \t\r]+
msp = space:[ \t\r]*

zmbs = zero_or_more_breaks_and_spaces:[,; \t\r\n]*
ombs = one_or_more_breaks_and_spaces:[,; \t\r\n]+

StartMergedGenes
    = "[" zmbs "\"" label:StringExceptQuotes "\"" {return {"label": label, "list":[]};}
    / "[" zmbs {return {"label": undefined, "list":[]};}

// Case-insensitive keywords
AMP = "AMP"i
HOMDEL = "HOMDEL"i
GAIN = "GAIN"i
HETLOSS = "HETLOSS"i
MUT = "MUT"i
EXP = "EXP"i
PROT = "PROT"i

// IMPORTANT GRAMMAR CONVENTION THAT MAKES THINGS WORK AND EASIER TO REASON ABOUT:
// Every object in a list (e.g. Query, MergedQuery, StandardQuery) only swallow spaces on the *left* (and in the inner part of the line).
// If they swallow spaces to the right *and* left, then we can get bugs, because this grammar engine works
//  by going through each definition top to bottom and choosing the first result it can make work to parse,
//  then proceeding. It doesn't backtrack. So queries that may seem valid will cause parser errors.
//
// FOR EXAMPLE: There was a bug like this:
//              Query = part1:Subquery ombs part2:Query { return part1.concat(part2); }
//                    / end:Subquery zmbs { return [end]; }
//
//              Subquery = zmbs gene:String zmbs { return gene; }
//
//  Where `ombs` means one or more breaks and spaces, `zmbs` means zero or more breaks and spaces
//  This means that "BRCA1 BRCA2" is not parseable. Trying to parse it:
//      (1) we enter into the Query definition
//      (2) we enter into Subquery, and successfully swallow "BRCA1 " and return "BRCA1"
//      (3) Now we have "BRCA2" but expect at least one space, so it fails.
//
//  Changing the `ombs` in the Query definition to `zmbs` doesn't work in general if you want to enforce a space between the objects in the list.
//

Query
    = mqr:MergedQuery ombs sqr:Query {return mqr.concat(sqr);}
    / qr:StandardQuery ombs sqr:Query {return qr.concat(sqr);}
    / mqr:MergedQuery zmbs {return mqr;}
    / qr:StandardQuery zmbs {return qr; }

MergedQuery
    = zmbs mergedGenes:StartMergedGenes qr:StandardQuery zmbs "]" zmbs mqr:MergedQuery { mergedGenes.list = qr; return [mergedGenes].concat(mqr);; }
    / zmbs mergedGenes:StartMergedGenes qr:StandardQuery zmbs "]" { mergedGenes.list = qr; return [mergedGenes]; }

StandardQuery
    = zmbs first:StructuralVariantQuery ombs rest:StandardQuery  { return [first].concat(rest); }
    / zmbs first:StructuralVariantQuery { return [first]; }
    / zmbs first:SingleGeneQuery ombs rest:StandardQuery  { return [first].concat(rest); }
    / zmbs first:SingleGeneQuery { return [first]; }

SingleGeneQuery
    = geneName:String msp ":" msp alts:Alterations { return {"gene": geneName, "alterations": alts}; }
    / geneName:String { return {"gene": geneName, "alterations":false}; }

StructuralVariantQuery
    = geneName1:String "::" geneName2:String msp ":" msp mods:StructuralVariantModifiers { return {"gene": geneName1, "alterations": [{alteration_type: 'downstream_fusion', gene: geneName2, modifiers: mods}]}; }
    / geneName1:String "::" geneName2:String { return {"gene": geneName1, "alterations": [{alteration_type: 'downstream_fusion', gene: geneName2, modifiers: []}]}; }
    / geneName1:String "::-" msp ":" msp mods:StructuralVariantModifiers { return {"gene": geneName1, "alterations": [{alteration_type: 'downstream_fusion', gene: '-', modifiers: mods}]}; }
    / geneName1:String "::-" { return {"gene": geneName1, "alterations": [{alteration_type: 'downstream_fusion', gene: '-', modifiers: []}]}; }
    / geneName1:String "::" msp ":" msp mods:StructuralVariantModifiers { return {"gene": geneName1, "alterations": [{alteration_type: 'downstream_fusion', gene: '*', modifiers: mods}]}; }
    / geneName1:String "::" { return {"gene": geneName1, "alterations": [{alteration_type: 'downstream_fusion', gene: '*', modifiers: []}]}; }
    / "-::" geneName2:String msp ":" msp mods:StructuralVariantModifiers { return {"gene": geneName2, "alterations": [{alteration_type: 'upstream_fusion', gene: '-', modifiers: mods}]}; }
    / "-::" geneName2:String { return {"gene": geneName2, "alterations": [{alteration_type: 'upstream_fusion', gene: '-', modifiers: []}]}; }
    / "::" geneName2:String msp ":" msp mods:StructuralVariantModifiers { return {"gene": geneName2, "alterations": [{alteration_type: 'upstream_fusion', gene: '*', modifiers: mods}]}; }
    / "::" geneName2:String { return {"gene": geneName2, "alterations": [{alteration_type: 'upstream_fusion', gene: '*', modifiers: []}]}; }

Alterations
    = a1:Alteration sp a2:Alterations { return [a1].concat(a2);}
    / a1:Alteration { return [a1]; }

Alteration
    = cmd:AnyTypeWithModifiersCommand { return cmd; }
    / cmd:CNACommand { return cmd; }
    / cmd:EXPCommand { return cmd; }
    / cmd:PROTCommand { return cmd; }
    / cmd:FUSIONCommandStructVar { return cmd; }
    / cmd:FUSIONCommand { return cmd; }
// MUT has to go at the end because it matches an arbitrary string at the end as a type of mutation
    / cmd:MUTCommand { return cmd; }

AnyTypeWithModifiersCommand
    = d:DriverModifier !"_" { return {"alteration_type":"any", modifiers:[d]}; }

CNAType
        = "AMP"i { return "AMP"; }
        / "HOMDEL"i { return "HOMDEL"; }
        / "GAIN"i { return "GAIN"; }
        / "HETLOSS"i { return "HETLOSS"; }

CNACommand
    = "CNA"i msp op:ComparisonOp msp constrval:CNAType { return {"alteration_type":"cna", "constr_rel":op, "constr_val":constrval, modifiers:[]}; }
    / "CNA_" mod:CNAModifier { return {"alteration_type":"cna", modifiers:[mod]}; }
    / constrval:CNAType "_" mod:CNAModifier { return {"alteration_type":"cna", "constr_rel":"=", "constr_val":constrval, modifiers:[mod]}; }
    / mod:CNAModifier "_CNA" { return {"alteration_type":"cna", modifiers:[mod]}; }
    / mod:CNAModifier "_" constrval:CNAType { return {"alteration_type":"cna", "constr_rel":"=", "constr_val":constrval, modifiers:[mod]}; }
    / constrval:CNAType { return {"alteration_type":"cna", "constr_rel":"=", "constr_val":constrval, modifiers:[]}; }

MUTCommand
    = "MUT" msp "=" msp mutation:MutationWithModifiers { return {"alteration_type":"mut", "constr_rel": "=", "constr_type":mutation.type, "constr_val":mutation.value, "info":mutation.info, modifiers: mutation.modifiers}; }
    / "MUT" msp "!=" msp mutation:MutationWithModifiers { return {"alteration_type":"mut", "constr_rel": "!=", "constr_type":mutation.type, "constr_val":mutation.value, "info":mutation.info, modifiers: mutation.modifiers}; }
    / mutation:MutationWithModifiers {
            if (mutation.type) {
                return {"alteration_type":"mut", "constr_rel": "=", "constr_type":mutation.type, "constr_val":mutation.value, "info":mutation.info, modifiers: mutation.modifiers};
            } else {
                return {"alteration_type":"mut", "info":{}, "modifiers": mutation.modifiers};
            }
        }

EXPCommand
        = "EXP" msp op:ComparisonOp msp constrval:Number { return {"alteration_type":"exp", "constr_rel":op, "constr_val":parseFloat(constrval)}; }

FUSIONCommand
        = "FUSION"i "_" mod:FusionModifier { return {"alteration_type":"fusion", modifiers: [mod] }; }
        / mod:FusionModifier "_FUSION"i { return {"alteration_type":"fusion", modifiers: [mod] }; }
        / "FUSION"i { return {"alteration_type":"fusion", modifiers:[]}; }

FUSIONCommandStructVar
        = alt:STRUCTVAR "_" mods:FusionModifiers { return {alteration_type:alt.type, gene:alt.gene, modifiers:mods }; }
        / alt:STRUCTVAR { return {alteration_type:alt.type, gene:alt.gene, modifiers:[] }; }
        / mods1:FusionModifiers "_" alt:STRUCTVAR "_" mods2:FusionModifiers { return {alteration_type:alt.type, gene:alt.gene, modifiers:mods1.concat(mods2) }; }
        / mods:FusionModifiers "_" alt:STRUCTVAR { return {alteration_type:alt.type, gene:alt.gene, modifiers:mods }; }

STRUCTVAR
        = sv:FUSIONWithGene {return sv}
        / sv:FUSIONWithUndefinedGene {return sv}
        / sv:FUSIONWithAnyGene {return sv}

FUSIONWithGene
        = geneName:AlphaNumeric "::FUSION"i { return {gene: geneName, type: 'upstream_fusion'}; }
        / "FUSION::"i geneName:AlphaNumeric { return {gene: geneName, type: 'downstream_fusion'}; }

FUSIONWithUndefinedGene
        = "-::FUSION"i {return {gene: '-', type: 'upstream_fusion'}; }
        / "FUSION::-"i {return {gene: '-', type: 'downstream_fusion'}; }

FUSIONWithAnyGene
        = "::FUSION"i {return {gene: '*', type: 'upstream_fusion'}; }
        / "FUSION::"i {return {gene: '*', type: 'downstream_fusion'}; }

PROTCommand
        = "PROT" msp op:ComparisonOp msp constrval:Number { return {"alteration_type":"prot", "constr_rel":op, "constr_val":parseFloat(constrval)}; }

ComparisonOp
    = ">=" { return ">="; }
    / "<=" { return "<="; }
    / ">" { return ">"; }
    / "<" { return "<"; }

MutationWithModifiers
    // modifier has to come first because mutation matches every string as protein change code
    = modifier:MutationModifier "_" mutationWithModifiers:MutationWithModifiers { mutationWithModifiers.modifiers.unshift(modifier); return mutationWithModifiers; }
    / mutation:Mutation "_" modifiers:MutationModifiers { mutation.modifiers = modifiers; return mutation; }
    / modifier:MutationModifier { return { info: {}, modifiers: [modifier] }; }
    / mutation:Mutation { mutation.modifiers = []; return mutation; }

MutationModifiers
    = modifier:MutationModifier "_" more:MutationModifiers { return [modifier].concat(more); }
    / modifier:MutationModifier { return [modifier]; }

StructuralVariantModifiers
    = modifier:StructuralVariantModifier "_" more:StructuralVariantModifier { return [modifier].concat(more); }
    / modifier:StructuralVariantModifier { return [modifier]; }

Mutation
    = "MUT"i { return {"info":{}}; }
    / "MISSENSE"i { return {"type":"class", "value":"MISSENSE", "info":{}}; }
    / "NONSENSE"i { return {"type":"class", "value":"NONSENSE", "info":{}}; }
    / "NONSTART"i { return {"type":"class", "value":"NONSTART", "info":{}}; }
    / "NONSTOP"i { return {"type":"class", "value":"NONSTOP", "info":{}}; }
    / "FRAMESHIFT"i { return {"type":"class", "value":"FRAMESHIFT", "info":{}}; }
    / "INFRAME"i { return {"type":"class", "value":"INFRAME", "info":{}}; }
    / "SPLICE"i { return {"type":"class", "value":"SPLICE", "info":{}}; }
    / "TRUNC"i { return {"type":"class", "value":"TRUNC", "info":{}}; }
    / "PROMOTER"i { return {"type":"class", "value":"PROMOTER", "info":{}}; }
    / letter:AminoAcid position:NaturalNumber string:MutationProteinChangeCode { return {"type":"name" , "value":(letter+position+string), "info":{}};}
    / letter:AminoAcid position:NaturalNumber { return {"type":"position", "value":parseInt(position), "info":{"amino_acid":letter.toUpperCase()}}; }
    / mutation_name:MutationProteinChangeCode { return {"type":"name", "value":mutation_name, "info":{"unrecognized":true}}; }

MutationProteinChangeCode // the purpose of this is to disambiguate modifiers from parts of protein change codes, since both can look like this "_SOMETHING"
    = !TrailingMutationModifier firstChar:MutationProteinChangeCodeChar !TrailingMutationModifier rest:MutationProteinChangeCode { return firstChar + rest; } // dont start with "_MUTATIONMODIFIER" and dont look like "x_MUTATIONMODIFIER"
    / !TrailingMutationModifier lastChar:MutationProteinChangeCodeChar { return lastChar; } // dont start with "_MUTATIONMODIFIER"

TrailingMutationModifier
    = "_" mod:MutationModifier { return mod; }

MutationModifier
    = "GERMLINE"i { return { type: "GERMLINE" };}
    / "SOMATIC"i { return { type: "SOMATIC" };}
    / mod:DriverModifier { return mod; }
    / range:RangeModifier { return range; }

CNAModifier
    // NOTE: if you ever want to add more modifiers, then to be able to specify in any order need to do
    //  same thing as in MutationWithModifiers
    = d:DriverModifier { return d; }

FusionModifier
    // NOTE: if you ever want to add more modifiers, then to be able to specify in any order with FUSION need to do
    //  same thing as in MutationWithModifiers
    = "GERMLINE"i { return { type: "GERMLINE" };}
    / "SOMATIC"i { return { type: "SOMATIC" };}
    / mod:DriverModifier { return mod; }

StructuralVariantModifier
    =  "GERMLINE"i { return { type: "GERMLINE" };}
    / "SOMATIC"i { return { type: "SOMATIC" };}
    / mod:DriverModifier { return mod; }

FusionModifiers
    = modifier:FusionModifier "_" more:FusionModifier { return [modifier].concat(more); }
    / modifier:FusionModifier { return [modifier]; }

DriverModifier
    = "DRIVER"i { return { type:"DRIVER" };}

RangeModifier
    = "(" start:NaturalNumber "-" end:NaturalNumber e:[*]? ")" { return { "type":"RANGE", "start":parseInt(start, 10), "end":parseInt(end, 10), completeOverlapOnly: !!e } }
    / "(-" end:NaturalNumber e:[*]? ")" { return { "type":"RANGE", "end":parseInt(end, 10), completeOverlapOnly: !!e } }
    / "(" start:NaturalNumber "-" e:[*]? ")" { return { "type":"RANGE", "start":parseInt(start, 10), completeOverlapOnly: !!e } }