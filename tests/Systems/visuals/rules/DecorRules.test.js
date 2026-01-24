
import { DecorRules } from '../../../../src/Systems/Visuals/rules/DecorRules.js';

describe('DecorRules', () => {
    describe('isTooCloseToSameType', () => {
        const existingDecorations = [
            { y: 100, type: 'TYPE_A' },
            { y: 300, type: 'TYPE_B' },
            { y: 500, type: 'TYPE_A' }
        ];

        test('should return true if decoration is too close to same type', () => {
            // 100 vs 150 = 50 diff < 100 min
            expect(DecorRules.isTooCloseToSameType(150, 'TYPE_A', existingDecorations, 100)).toBe(true);
        });

        test('should return false if decoration is far enough from same type', () => {
            // 100 vs 210 = 110 diff > 100 min
            expect(DecorRules.isTooCloseToSameType(210, 'TYPE_A', existingDecorations, 100)).toBe(false);
        });

        test('should ignore decorations of different types', () => {
            // Close to TYPE_B (300) but we are checking TYPE_A
            expect(DecorRules.isTooCloseToSameType(310, 'TYPE_A', existingDecorations, 100)).toBe(false);
        });
    });

    describe('checkVerticalOverlap', () => {
        const existingDecorations = [
            { // Existing Pipe on Right: Y=100 to 200
                y: 100,
                height: 100,
                side: 'right',
                type: 'PIPE',
                getHeight: () => 100
            }
        ];

        test('should detect overlap with existing pipe on same side', () => {
            // New pipe: Y=150, Height=50 -> Range 150-200. Overlaps 100-200.
            expect(DecorRules.checkVerticalOverlap(150, 50, 'right', 'PIPE', existingDecorations)).toBe(true);
        });

        test('should not detect overlap if completely below', () => {
            // New pipe: Y=250, Height=50 -> Range 250-300. 
            expect(DecorRules.checkVerticalOverlap(250, 50, 'right', 'PIPE', existingDecorations)).toBe(false);
        });

        test('should not detect overlap if completely above', () => {
            // New pipe: Y=0, Height=50 -> Range 0-50.
            expect(DecorRules.checkVerticalOverlap(0, 50, 'right', 'PIPE', existingDecorations)).toBe(false);
        });

        test('should ignore pipes on the other side', () => {
            // New pipe overlaps Y coords but is on 'left' side
            expect(DecorRules.checkVerticalOverlap(150, 50, 'left', 'PIPE', existingDecorations)).toBe(false);
        });

        test('should respect margin', () => {
            // Existing ends at 200. New starts at 210.
            // Without margin: No overlap (210 > 200).
            // With margin 20: Proposed start becomes 210-20=190. 190 < 200 -> Overlap!
            expect(DecorRules.checkVerticalOverlap(210, 50, 'right', 'PIPE', existingDecorations, 20)).toBe(true);
        });
    });
    describe('hasEnoughHeight', () => {
        test('should return true if currentHeight is greater or equal to minHeight', () => {
            expect(DecorRules.hasEnoughHeight(100, 100)).toBe(true);
            expect(DecorRules.hasEnoughHeight(200, 100)).toBe(true);
        });

        test('should return false if currentHeight is less than minHeight', () => {
            expect(DecorRules.hasEnoughHeight(99, 100)).toBe(false);
            expect(DecorRules.hasEnoughHeight(0, 100)).toBe(false);
        });
    });
});
