export function getVertexShaderSource(columnsRightAfterGapsSize: number) {
    return `precision highp float;
            attribute float aPosVertex;
            attribute float aColVertex;
            attribute float aVertexOncoprintColumn;

            uniform float gapSize;

            uniform float columnsRightAfterGaps[${columnsRightAfterGapsSize}]; // sorted in ascending order

            uniform float columnWidth;
            uniform float scrollX;
            uniform float zoomX;
            uniform float scrollY;
            uniform float zoomY;
            uniform mat4 uMVMatrix;
            uniform mat4 uPMatrix;
            uniform float offsetY;
            uniform float supersamplingRatio;
            uniform float positionBitPackBase;
            uniform float texSize;
            varying float texCoord;
            
            

            vec3 getUnpackedPositionVec3() {
            	float pos0 = floor(aPosVertex / (positionBitPackBase * positionBitPackBase));
            	float pos0Contr = pos0 * positionBitPackBase * positionBitPackBase;
            	float pos1 = floor((aPosVertex - pos0Contr)/positionBitPackBase);
            	float pos1Contr = pos1 * positionBitPackBase;
            	float pos2 = aPosVertex - pos0Contr - pos1Contr;
            	return vec3(pos0, pos1, pos2);
            }

            float getGapOffset() {
                // first do binary search to compute the number of gaps before this column, G(c)
                // G(c) = the index in columnsRightAfterGaps of the first entry thats greater than c
                 
                int lower_incl = 0;
                int upper_excl = ${columnsRightAfterGapsSize};
                int numGaps = 0;
                
                for (int loopDummyVar = 0; loopDummyVar == 0; loopDummyVar += 0) {
                    if (lower_incl >= upper_excl) {
                        break;
                    }
                
                    int middle = (lower_incl + upper_excl)/2;
                    if (columnsRightAfterGaps[middle] < aVertexOncoprintColumn) {
                        // G(c) > middle
                        lower_incl = middle + 1;
                    } else if (columnsRightAfterGaps[middle] == aVertexOncoprintColumn) {
                        // G(c) = middle + 1
                        numGaps = middle + 1;
                        break;
                    } else {
                        // columnsRightAfterGaps[middle] > column, so G(c) <= middle
                        if (middle == 0) {
                            // 0 <= G(c) <= 0 -> G(c) = 0
                            numGaps = 0;
                            break;
                        } else if (columnsRightAfterGaps[middle-1] < aVertexOncoprintColumn) {
                            // G(c) = middle
                            numGaps = middle;
                            break;
                        } else {
                            // columnsRightAfterGaps[middle-1] >= column, so G(c) <= middle-1
                            upper_excl = middle;
                        }
                    }
                }
 
                // multiply it by the gap size to get the total offset
                return float(numGaps)*gapSize;
            }

            void main(void) {
            	gl_Position = vec4(getUnpackedPositionVec3(), 1.0);
            	gl_Position[0] += aVertexOncoprintColumn*columnWidth;
            	gl_Position *= vec4(zoomX, zoomY, 1.0, 1.0);

            // gaps should not be affected by zoom:
                gl_Position[0] += getGapOffset();

            // offsetY is given zoomed:
            	gl_Position[1] += offsetY;

            	gl_Position -= vec4(scrollX, scrollY, 0.0, 0.0);
            	gl_Position[0] *= supersamplingRatio;
            	gl_Position[1] *= supersamplingRatio;
            	gl_Position = uPMatrix * uMVMatrix * gl_Position;

            	texCoord = (aColVertex + 0.5) / texSize;
            }`;
}

export function getFragmentShaderSource() {
    return `precision mediump float;
            varying float texCoord;
            uniform sampler2D uSampler;
            void main(void) {
                gl_FragColor = texture2D(uSampler, vec2(texCoord, 0.5));
            }`;
}
