#!/bin/bash
(
    echo '[';
    curl 'https://raw.githubusercontent.com/genome-nexus/genome-nexus-importer/v0.6/export/hotspots_v2_and_3d.txt' | \
        cut -f1 | tail -n +2 | sort -u | sed 's/^/"/g' | sed 's/$/",/g' | sed '$ s/,$/]/';
)
