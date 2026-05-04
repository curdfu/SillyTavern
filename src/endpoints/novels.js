import express from 'express';

export const router = express.Router();

router.get('/', (_request, response) => response.sendStatus(204));
