import { EmbeddingPoint } from '../EmbeddingTypes';

/**
 * Perform rectangle selection using deck.gl's picking
 */
export function performRectangleSelection(
    deckRef: React.RefObject<any>,
    selectionStart: { x: number; y: number },
    selectionEnd: { x: number; y: number }
): EmbeddingPoint[] {
    if (!deckRef.current || !selectionStart || !selectionEnd) {
        return [];
    }

    // Calculate rectangle bounds
    const left = Math.min(selectionStart.x, selectionEnd.x);
    const top = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    try {
        // Access the underlying deck instance
        const deck = deckRef.current.deck as any;
        if (!deck) {
            console.warn('Deck instance not available');
            return [];
        }

        // Use deck.gl's built-in picking for accurate selection
        let pickedObjects: any[] = [];

        if (typeof deck.pickObjects === 'function') {
            pickedObjects = deck.pickObjects({
                x: left,
                y: top,
                width,
                height,
                layerIds: ['embedding-scatter'],
            });
        } else if (typeof deck.pickMultipleObjects === 'function') {
            pickedObjects = deck.pickMultipleObjects({
                x: left,
                y: top,
                width,
                height,
                layerIds: ['embedding-scatter'],
            });
        } else {
            // Fallback: sample multiple points within the rectangle
            const samplePoints: any[] = [];
            const stepSize = 5; // Sample every 5 pixels
            for (let x = left; x < left + width; x += stepSize) {
                for (let y = top; y < top + height; y += stepSize) {
                    if (typeof deck.pickObject === 'function') {
                        const picked = deck.pickObject({
                            x,
                            y,
                            layerIds: ['embedding-scatter'],
                        });
                        if (picked && picked.object) {
                            samplePoints.push(picked);
                        }
                    }
                }
            }
            pickedObjects = samplePoints;
        }

        return pickedObjects
            .map((info: any) => info.object)
            .filter((obj: any) => obj != null);
    } catch (error) {
        console.warn('Rectangle selection failed:', error);
        return [];
    }
}
