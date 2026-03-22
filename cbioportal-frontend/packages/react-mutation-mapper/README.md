# react-mutation-mapper

> 

[![NPM](https://img.shields.io/npm/v/react-mutation-mapper.svg)](https://www.npmjs.com/package/react-mutation-mapper) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-mutation-mapper
```

## Usage

### LollipopPlot

```tsx
import * as React from 'react'

import {LollipopPlot} from 'react-mutation-mapper'

class Example extends React.Component {
  render () {
    return (
      <LollipopPlot
        lollipops={[
          {codon: 36, count: 6, color: "#6600AA"},
          {codon: 366, count: 4, color: "#00AAFF"},
          {codon: 606, count: 8, color: "#AA0066"}
        ]}
        domains={[
          {startCodon: 6, endCodon: 66, color: "#FF9900", label: "D1"},
          {startCodon: 566, endCodon: 616, color: "#0044CC", label: "D2"}
        ]}
        vizWidth={640}
        vizHeight={200}
        xMax={666}
        yMax={10}
      />
    )
  }
}
```

### LollipopMutationPlot

```tsx
import * as React from 'react'

import {
  DefaultMutationMapperStore, LollipopMutationPlot
} from 'react-mutation-mapper'

class Example extends React.Component {
  render () {
    return (
      <LollipopMutationPlot
        store={
          new DefaultMutationMapperStore(
            {hugoGeneSymbol: "TP53", entrezGeneId: 7157},
            {isoformOverrideSource: "mskcc", filterMutationsBySelectedTranscript: true},
            () => [{
              chromosome: "17",
              startPosition: 41246256,
              endPosition: 41246256,
              proteinChange: "V6E",
              proteinPosEnd: 6,
              proteinPosStart: 6,
              referenceAllele: "G",
              variantAllele: "T",
              mutationType: "missense"
            }, {
              chromosome: "17",
              startPosition: 41246666,
              endPosition: 41246666,
              proteinChange: "V66E",
              proteinPosEnd: 66,
              proteinPosStart: 66,
              referenceAllele: "A",
              variantAllele: "C",
              mutationType: "inframe_del"
            }])
          }
        geneWidth={666}
      />
    )
  }
}
```

## License

 © [cBioPortal](https://github.com/cBioPortal)
