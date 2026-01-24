import RiserPipelineManager, { RiserPipelineManager as ManagerClass } from '../../src/Systems/Gameplay/RiserPipelineManager.js';
import { RISER_TYPES } from '../../src/Config/RiserConfig.js';

describe('RiserPipelineManager', () => {
    test('getPipelineForType should return configured pipeline names', () => {
        expect(RiserPipelineManager.getPipelineForType(RISER_TYPES.LAVA)).toBe('FluidPipeline');
        expect(RiserPipelineManager.getPipelineForType(RISER_TYPES.FIRE)).toBe('FlamesPipeline');
    });

    test('getPipelineForType should warn and default for unknown types', () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

        const result = RiserPipelineManager.getPipelineForType('UNKNOWN');

        expect(result).toBeNull();
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    test('registerRiserType should allow custom categories and list them', () => {
        const manager = new ManagerClass();
        manager.registerRiserType('ICE', 'Chill');

        expect(manager.getPipelineForType('ICE')).toBe('ChillPipeline');
        expect(manager.getRegisteredCategories()).toEqual(expect.arrayContaining(['Chill', 'Fluid', 'Flames']));
    });
});
