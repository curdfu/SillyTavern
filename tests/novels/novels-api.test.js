import { describe, test, expect } from '@jest/globals';
import express from 'express';

import { router as novelsRouter } from '../../src/endpoints/novels.js';

describe('novels api', () => {
    test('exports an express router', () => {
        const app = express();
        app.use('/api/novels', novelsRouter);

        expect(novelsRouter).toBeDefined();
        expect(typeof novelsRouter.use).toBe('function');
    });
});
