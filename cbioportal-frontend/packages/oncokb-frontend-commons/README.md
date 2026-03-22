# oncokb-frontend-commons

> 

[![NPM](https://img.shields.io/npm/v/oncokb-frontend-commons.svg)](https://www.npmjs.com/package/oncokb-frontend-commons) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save oncokb-frontend-commons
```

## Usage

### OncoKB

```tsx
import * as React from 'react'

import { OncoKB } from 'oncokb-frontend-commons';

class Example extends React.Component {

  render () {
    return (
      <OncoKB
            status={'pending'}
            mergeAnnotationIcons={true}
            isCancerGene={true}
            geneNotExist={false}
            hugoGeneSymbol={"BRCA2"}
      />
    );
  }
}
```

### OncoKBSummaryTable

```tsx
import * as React from 'react'

import { OncoKbSummaryTable } from 'oncokb-frontend-commons';

class Example extends React.Component {
  const tableData = [{
    count: 1,
    proteinChange: "C47W",
    clinicalImplication: ["Oncogenic"],
    biologicalEffect: "The BRCA1 C47G mutation is located in the RING domain of the protein. In a homology-directed recombination (HDR) assay, BRCA1 C47G was shown to result in non-functional homologous repair...",
    level: [
          {
            level: "Level 1"
            tumorTypes: ["Ovarian Cancer"];
          },
          {
            level: "Level 3B"
            tumorTypes: ["Breast Cancer"];
          }]
  }]

  render () {
    return (
      <OncoKbSummaryTable
          data={tableData}
      />
    );
  }
}
```

## Contact

To report any issues, please email contact@oncokb.org

 © [cBioPortal](https://github.com/cBioPortal)

